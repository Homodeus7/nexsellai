import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

/**
 * Create Telegram invite link for specific channel
 * @param channelId - Telegram channel ID (e.g., '@channel_name' or '-100123456789')
 * @param expiresAt - Expiration date for the invite link
 * @returns Invite link URL
 */
export async function createInviteLink(
  channelId: string,
  expiresAt: Date
): Promise<string> {
  try {
    console.log(`[Telegram] Creating invite link for channel: ${channelId}`);
    console.log(`[Telegram] Expires: ${expiresAt.toISOString()}`);

    const link = await bot.telegram.createChatInviteLink(channelId, {
      expire_date: Math.floor(expiresAt.getTime() / 1000),
      member_limit: 1,
      creates_join_request: false,
    });

    console.log(`[Telegram] Invite link created successfully: ${link.invite_link}`);
    return link.invite_link;
  } catch (error) {
    console.error(`[Telegram] Failed to create invite link for ${channelId}:`, error);
    throw new Error(`Failed to create Telegram invite link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Revoke Telegram invite link
 * @param channelId - Telegram channel ID
 * @param inviteLink - Invite link to revoke
 */
export async function revokeInviteLink(
  channelId: string,
  inviteLink: string
): Promise<void> {
  try {
    console.log(`[Telegram] Revoking invite link in channel: ${channelId}`);
    console.log(`[Telegram] Link: ${inviteLink}`);

    await bot.telegram.revokeChatInviteLink(channelId, inviteLink);

    console.log(`[Telegram] Invite link revoked successfully`);
  } catch (error) {
    console.error(`[Telegram] Failed to revoke invite link in ${channelId}:`, error);
    // Не бросаем ошибку, так как отзыв не критичен
  }
}
