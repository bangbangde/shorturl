import { customAlphabet } from "nanoid";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateShortCode(length: number = 6): string {
  const nanoid = customAlphabet(ALPHABET, length);
  return nanoid();
}
