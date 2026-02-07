import { Router } from "express";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { validate } from "../../../middleware/validate.js";
import { env } from "../../config/env.js";

const router = Router();

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/admin/login
router.post("/login", validate(loginSchema), async (req, res) => {
  const { login, password } = req.body;

  const admin = await prisma.adminUser.findUnique({ where: { login } });
  if (!admin) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ id: admin.id, login: admin.login }, env.JWT_SECRET, {
    expiresIn: "24h",
  });

  res.json({ success: true, data: { token } });
});

export default router;
