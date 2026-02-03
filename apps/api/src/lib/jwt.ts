import * as jose from "jose";

const getAccessSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
};

export async function generateAccessToken(userId: string): Promise<string> {
  const token = await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessSecret());

  return token;
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());

  return token;
}

export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  try {
    const verified = await jose.jwtVerify(token, getAccessSecret());
    return {
      userId: verified.payload.userId as string,
    };
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  try {
    const verified = await jose.jwtVerify(token, getRefreshSecret());
    return {
      userId: verified.payload.userId as string,
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}
