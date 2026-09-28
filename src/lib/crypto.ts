// crypto.ts — pure helpers mirroring contracts/cistern.compact's hashing.

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSecretHex(bytes = 16): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Matches `persistentHash<Vector<2,Bytes<32>>>([secret, hash(shareAmount)])`. */
export async function deriveRecipientLeaf(secret: string, shareAmount: number): Promise<string> {
  const amountHash = await sha256Hex(String(shareAmount));
  return sha256Hex(`${secret}:${amountHash}`);
}

/** Matches the circuit's `[secret, hash(poolLabel), hash(roundIndex)]`. */
export async function deriveTrancheNullifier(secret: string, poolLabel: string, roundIndex: number): Promise<string> {
  const labelHash = await sha256Hex(poolLabel);
  const roundHash = await sha256Hex(String(roundIndex));
  return sha256Hex(`${secret}:${labelHash}:${roundHash}`);
}

export function isRoundVested(roundIndex: number, currentRound: number, totalRounds: number): boolean {
  return Number.isInteger(roundIndex) && roundIndex >= 1 && roundIndex <= totalRounds && roundIndex <= currentRound;
}
