import crypto from "crypto";

export function verifyHmacSignature(
  origin: string,
  timestamp: string,
  body: string,
  signature: string,
  secret: string
): boolean {
  // Check timestamp within ±300 seconds
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  const message = `${origin}\n${timestamp}\n${body}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export function generateHmacSignature(
  origin: string,
  timestamp: string,
  body: string,
  secret: string
): string {
  const message = `${origin}\n${timestamp}\n${body}`;
  return crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
}
