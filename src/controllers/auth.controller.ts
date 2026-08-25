import { Request, Response } from "express";
import {
  changePassword,
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../services/auth.service.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";
import { AppError } from "../lib/app-error.js";
import prisma from "../lib/prisma.js";

export const register = async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const { name, email, password } = result.data;
    const user = await registerUser({
      name,
      email,
      password,
    });

    res.status(201).json({
      message:
        "User registered ! Please check your email to verify your account.",
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR:");
    console.error(error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong while registering the user",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;

    const result = await loginUser({
      email,
      password,
    });

    return res.status(200).json({
      message: "User logged in successfully",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("LOGIN ERROR:");
    console.error(error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong while logging in the user",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("GET ME ERROR:");
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong while fetching user",
    });
  }
};

export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const token = req.query.token;

    if (typeof token !== "string" || !token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const result = await verifyEmail(token);

    return res.status(200).json(result);
  } catch (error) {
    console.error("EMAIL VERIFICATION ERROR:");
    console.error(error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong while verifying email",
    });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email } = validation.data;

    await forgotPassword(email);

    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:");
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong while processing your request",
    });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { token, newPassword } = validation.data;

    const result = await resetPassword(token, newPassword);

    return res.status(200).json(result);
  } catch (error) {
    console.error("RESET PASSWORD ERROR:");
    console.error(error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong while resetting your password",
    });
  }
};

export const changePasswordController = async (req: Request, res: Response) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { currentPassword, newPassword } = validation.data;

    if (req.userId === undefined) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = await changePassword(
      req.userId,
      currentPassword,
      newPassword,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:");
    console.error(error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong while changing your password",
    });
  }
};
