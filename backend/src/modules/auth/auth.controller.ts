import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createMerchant, findMerchantByEmail, emailExists } from "../merchants/merchants.queries";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokens";
import { redis } from "../../config/redis";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;


    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must contain at least 2 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }


    const exists = await emailExists(email);

    if (exists) {
      return res.status(409).json({
        error: "Merchant already exists",
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const merchant = await createMerchant(
      name,
      email,
      hashedPassword
    );

    return res.status(201).json({
      message: "Merchant registered successfully",
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;



    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }



    const merchant = await findMerchantByEmail(email);

    if (!merchant) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }



    const validPassword = await bcrypt.compare(
      password,
      merchant.password
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }



    const accessToken = generateAccessToken(merchant.id);

    const {
      token: refreshToken,
      jti,
    } = generateRefreshToken(merchant.id);



    await redis.set(
      `refresh:${merchant.id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );



    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });



    return res.status(200).json({
      message: "Login successful",

      accessToken,

      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {

    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({
        error: "Refresh token not found",
      });
    }


    let payload: {
      merchantId: string;
      jti: string;
      exp: number;
    };

    try {
      payload = jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as {
        merchantId: string;
        jti: string;
        exp: number;
      };
    } catch {
      return res.status(401).json({
        error: "Invalid or expired refresh token",
      });
    }


    const blacklisted = await redis.get(
      `blacklist:${payload.jti}`
    );

    if (blacklisted) {
      return res.status(401).json({
        error: "Refresh token has been revoked",
      });
    }



    const storedToken = await redis.get(
      `refresh:${payload.merchantId}`
    );

    if (!storedToken || storedToken !== oldRefreshToken) {
      return res.status(401).json({
        error: "Refresh token is no longer valid",
      });
    }


    const secondsRemaining =
      payload.exp - Math.floor(Date.now() / 1000);

    if (secondsRemaining > 0) {
      await redis.set(
        `blacklist:${payload.jti}`,
        "revoked",
        "EX",
        secondsRemaining
      );
    }

  

    const newAccessToken = generateAccessToken(
      payload.merchantId
    );

    const {
      token: newRefreshToken,
    } = generateRefreshToken(payload.merchantId);


    await redis.set(
      `refresh:${payload.merchantId}`,
      newRefreshToken,
      "EX",
      7 * 24 * 60 * 60
    );



    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });



    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}



export async function logout(req: Request, res: Response) {
  try {

    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {

      try {

        const payload = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET!
        ) as {
          merchantId: string;
          jti: string;
          exp: number;
        };



        const secondsRemaining =
          payload.exp - Math.floor(Date.now() / 1000);

        if (secondsRemaining > 0) {
          await redis.set(
            `blacklist:${payload.jti}`,
            "revoked",
            "EX",
            secondsRemaining
          );
        }


        await redis.del(
          `refresh:${payload.merchantId}`
        );

      } catch {
        // Ignore invalid refresh token
      }
    }


    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}