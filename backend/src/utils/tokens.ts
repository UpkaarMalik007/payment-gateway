import jwt,{JwtPayload} from "jsonwebtoken";
import crypto from "crypto";


interface AccessTokenPayload extends JwtPayload {
  merchantId: string;
}

interface RefreshTokenPayload extends JwtPayload {
  merchantId: string;
  jti: string;
}


export function generateAccessToken(merchantId: string): string {
  return jwt.sign(
    { merchantId },
    process.env.JWT_ACCESS_SECRET!,
    {
      expiresIn:"15m",
    }
  );
}


export function generateRefreshToken(merchantId: string) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    {
      merchantId,
      jti,
    },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn:"7d",
    }
  );

  return {
    token,
    jti,
  };
}


export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET!
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!
  ) as RefreshTokenPayload;
}