import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { generateToken } from "../lib/jwt.js";
import { AppError } from "../lib/app-error.js";
import crypto from "crypto";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./email.service.js";
interface RegisterData {
  name: string;
  email: string;
  password: string;
}
interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async ({ name, email, password }: RegisterData) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
    },
  });

  const verificationToken = crypto.randomBytes(32).toString("hex");

  await prisma.emailVerificationToken.create({
    data: {
      token: verificationToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });
  await sendVerificationEmail(user.email, user.name, verificationToken);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
};

export const loginUser = async ({ email, password }: LoginData) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!existingUser) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, existingUser.passwordHash);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }
  if (!existingUser.emailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }
  const token = generateToken(existingUser.id);
  return {
    token,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      createdAt: existingUser.createdAt,
    },
  };
};

export const verifyEmail = async (token: string) => {
  console.log("=================================");
  console.log("TOKEN RECEIVED:");
  console.log(JSON.stringify(token));
  console.log("TOKEN LENGTH:", token.length);

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: {
      token,
    },
  });

  console.log("DATABASE RESULT:");
  console.log(verificationToken);

  if (!verificationToken) {
    throw new AppError("Invalid verification token", 400);
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new AppError("Verification token has expired", 400);
  }

  await prisma.user.update({
    where: {
      id: verificationToken.userId,
    },
    data: {
      emailVerified: true,
    },
  });

  await prisma.emailVerificationToken.delete({
    where: {
      id: verificationToken.id,
    },
  });

  return {
    message: "Email verified successfully",
  };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return;
  }

  await (prisma as any).passwordResetToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  const resetToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await (prisma as any).passwordResetToken.create({
    data: {
      token: tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  await sendPasswordResetEmail(user.email, user.name, resetToken);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await (prisma as any).passwordResetToken.findUnique({
    where: {
      token: tokenHash,
    },
  });

  if (!resetToken) {
    throw new AppError("Invalid or expired password reset token", 400);
  }

  if (resetToken.expiresAt < new Date()) {
    await (prisma as any).passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });

    throw new AppError("Password reset token has expired", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: resetToken.userId,
    },
    data: {
      passwordHash: hashedPassword,
    },
  });

  await (prisma as any).passwordResetToken.delete({
    where: {
      id: resetToken.id,
    },
  });

  return {
    message: "Password reset successfully",
  };
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

  if (isSamePassword) {
    throw new AppError(
      "New password must be different from your current password",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash: hashedPassword,
    },
  });

  return {
    message: "Password changed successfully",
  };
};
