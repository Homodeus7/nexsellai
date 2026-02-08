import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "qwerty";

export const adminGuardMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = req.headers["authorization"] as string;
  if (!auth) {
    res.sendStatus(401);
    return;
  }

  const [authType, token] = auth.split(" ");

  // Поддержка JWT Bearer токенов (для SPA)
  if (authType === "Bearer") {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      (req as any).admin = decoded;
      next();
      return;
    } catch (error) {
      res.sendStatus(401);
      return;
    }
  }

  // Поддержка Basic Auth (для совместимости)
  if (authType === "Basic") {
    const credentials = Buffer.from(token, "base64").toString("utf-8");
    const [username, password] = credentials.split(":");

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.sendStatus(401);
      return;
    }

    next();
    return;
  }

  res.sendStatus(401);
};
