import crypto from 'crypto';
import { env } from '../config/env.js';

export interface PaymentResult {
  payment_id: string;
  payment_url: string;
}

type FreedomPayParams = Record<string, string | number | boolean | null | undefined>;

const INIT_PAYMENT_PATH = '/init_payment';

export function getScriptNameFromPath(pathname: string): string {
  const normalized = pathname.split('?')[0].replace(/\/+$/, '');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

function makeFlatParamsArray(
  params: Record<string, unknown>,
  parentKey = '',
  result: Record<string, string> = {},
): Record<string, string> {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const composedKey = parentKey ? `${parentKey}[${key}]` : key;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item === undefined || item === null) {
          return;
        }
        if (typeof item === 'object') {
          makeFlatParamsArray(item as Record<string, unknown>, `${composedKey}[${index}]`, result);
        } else {
          result[`${composedKey}[${index}]`] = String(item);
        }
      });
      return;
    }

    if (typeof value === 'object') {
      makeFlatParamsArray(value as Record<string, unknown>, composedKey, result);
      return;
    }

    result[composedKey] = String(value);
  });

  return result;
}

function computeSignature(scriptName: string, params: Record<string, unknown>): string {
  const flatParams = makeFlatParamsArray(params);
  const sortedKeys = Object.keys(flatParams).sort();
  const signatureParts = [scriptName, ...sortedKeys.map((key) => flatParams[key]), env.FREEDOM_PAY_SECRET_KEY];
  const signatureString = signatureParts.join(';');
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

function buildSignedParams(scriptName: string, params: FreedomPayParams): Record<string, string> {
  const cleanedParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    cleanedParams[key] = String(value);
  });

  const pg_sig = computeSignature(scriptName, cleanedParams);
  return { ...cleanedParams, pg_sig };
}

function getXmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

export async function createPayment(
  orderUid: string,
  amount: number,
  currency: string,
  description: string,
): Promise<PaymentResult> {
  const pg_salt = crypto.randomBytes(16).toString('hex');
  const amountValue = Number(amount).toFixed(2);

  const params: FreedomPayParams = {
    pg_merchant_id: env.FREEDOM_PAY_MERCHANT_ID,
    pg_order_id: orderUid,
    pg_amount: amountValue,
    pg_currency: currency,
    pg_description: description,
    pg_result_url: env.FREEDOM_PAY_RESULT_URL,
    pg_success_url: env.FREEDOM_PAY_SUCCESS_URL,
    pg_failure_url: env.FREEDOM_PAY_FAILURE_URL,
    pg_request_method: 'POST',
    pg_success_url_method: 'GET',
    pg_failure_url_method: 'GET',
    pg_testing_mode: env.FREEDOM_PAY_TESTING_MODE,
    pg_salt,
  };

  const scriptName = getScriptNameFromPath(INIT_PAYMENT_PATH);
  const signedParams = buildSignedParams(scriptName, params);

  const url = new URL(INIT_PAYMENT_PATH, env.FREEDOM_PAY_API_BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedParams),
  });

  const responseText = await response.text();
  const status = getXmlValue(responseText, 'pg_status');
  if (!response.ok || status !== 'ok') {
    const errorCode = getXmlValue(responseText, 'pg_error_code');
    const descriptionText = getXmlValue(responseText, 'pg_error_description') || getXmlValue(responseText, 'pg_description');
    throw new Error(
      `[FreedomPay] init_payment failed: status=${status ?? response.status} code=${errorCode ?? 'n/a'} desc=${descriptionText ?? 'n/a'}`,
    );
  }

  const payment_id = getXmlValue(responseText, 'pg_payment_id');
  const payment_url = getXmlValue(responseText, 'pg_redirect_url');

  if (!payment_id || !payment_url) {
    throw new Error('[FreedomPay] init_payment response missing payment_id or payment_url');
  }

  return { payment_id, payment_url };
}

export function verifyWebhookSignature(body: Record<string, unknown>, signature: string, scriptName: string): boolean {
  const params = { ...body } as Record<string, unknown>;
  delete params.pg_sig;
  const expected = computeSignature(scriptName, params);
  return expected === signature;
}

export function buildWebhookResponse(
  scriptName: string,
  status: 'ok' | 'error',
  description: string,
): string {
  const pg_salt = crypto.randomBytes(16).toString('hex');
  const params = {
    pg_status: status,
    pg_description: description,
    pg_salt,
  };
  const pg_sig = computeSignature(scriptName, params);

  return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <pg_status>${status}</pg_status>
  <pg_description>${description}</pg_description>
  <pg_salt>${pg_salt}</pg_salt>
  <pg_sig>${pg_sig}</pg_sig>
</response>`;
}

export function normalizeCallbackStatus(payload: Record<string, unknown>): 'success' | 'failed' | 'unknown' {
  const rawStatus = String(payload.pg_status ?? payload.status ?? '').toLowerCase();
  const rawResult = String(payload.pg_result ?? '').toLowerCase();

  if (rawStatus === 'success' || rawStatus === 'paid' || rawStatus === 'ok' || rawResult === '1' || rawResult === 'true') {
    return 'success';
  }

  if (rawStatus === 'failed' || rawStatus === 'error' || rawStatus === 'rejected' || rawResult === '0' || rawResult === 'false') {
    return 'failed';
  }

  return 'unknown';
}

export function extractPaymentIdentifiers(payload: Record<string, unknown>): {
  paymentId?: string;
  orderId?: string;
} {
  const paymentId = payload.pg_payment_id ?? payload.order_id ?? payload.payment_id;
  const orderId = payload.pg_order_id ?? payload.order_uid ?? payload.orderId;

  return {
    paymentId: paymentId ? String(paymentId) : undefined,
    orderId: orderId ? String(orderId) : undefined,
  };
}
