import { describe, it, expect } from "vitest";
import { deriveRecipientLeaf, deriveTrancheNullifier, isRoundVested, randomSecretHex } from "../src/lib/crypto";

describe("deriveRecipientLeaf", () => {
  it("is deterministic for the same secret and share amount", async () => {
    const a = await deriveRecipientLeaf("recipient-a-secret", 5000);
    const b = await deriveRecipientLeaf("recipient-a-secret", 5000);
    expect(a).toBe(b);
  });

  it("produces a 64-character hex digest", async () => {
    expect(await deriveRecipientLeaf("recipient-a-secret", 5000)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs when the share amount differs (binds amount into the leaf)", async () => {
    const a = await deriveRecipientLeaf("recipient-a-secret", 5000);
    const b = await deriveRecipientLeaf("recipient-a-secret", 7500);
    expect(a).not.toBe(b);
  });

  it("differs for different secrets with the same amount", async () => {
    const a = await deriveRecipientLeaf("recipient-a-secret", 5000);
    const b = await deriveRecipientLeaf("recipient-b-secret", 5000);
    expect(a).not.toBe(b);
  });
});

describe("deriveTrancheNullifier", () => {
  it("is deterministic for the same secret, pool, and round", async () => {
    const a = await deriveTrancheNullifier("recipient-a-secret", "Q1 Grant Pool", 1);
    const b = await deriveTrancheNullifier("recipient-a-secret", "Q1 Grant Pool", 1);
    expect(a).toBe(b);
  });

  it("differs between rounds for the same recipient (one claim per round)", async () => {
    const round1 = await deriveTrancheNullifier("recipient-a-secret", "Q1 Grant Pool", 1);
    const round2 = await deriveTrancheNullifier("recipient-a-secret", "Q1 Grant Pool", 2);
    expect(round1).not.toBe(round2);
  });

  it("differs between pools for the same recipient and round", async () => {
    const poolA = await deriveTrancheNullifier("recipient-a-secret", "Q1 Grant Pool", 1);
    const poolB = await deriveTrancheNullifier("recipient-a-secret", "Q2 Grant Pool", 1);
    expect(poolA).not.toBe(poolB);
  });

  it("never contains the raw secret as a substring", async () => {
    const n = await deriveTrancheNullifier("recipient-a-secret", "Q1 Grant Pool", 1);
    expect(n).not.toContain("recipient-a-secret");
  });
});

describe("isRoundVested", () => {
  it("accepts a round at or before the current round", () => {
    expect(isRoundVested(1, 3, 6)).toBe(true);
    expect(isRoundVested(3, 3, 6)).toBe(true);
  });

  it("rejects a round beyond the current round (not vested yet)", () => {
    expect(isRoundVested(4, 3, 6)).toBe(false);
  });

  it("rejects a round outside 1..totalRounds", () => {
    expect(isRoundVested(0, 3, 6)).toBe(false);
    expect(isRoundVested(7, 6, 6)).toBe(false);
  });

  it("rejects non-integer input", () => {
    expect(isRoundVested(1.5, 3, 6)).toBe(false);
  });
});

describe("randomSecretHex", () => {
  it("produces distinct secrets across calls", () => {
    expect(randomSecretHex()).not.toBe(randomSecretHex());
  });

  it("produces a hex string of the expected length", () => {
    expect(randomSecretHex(16)).toMatch(/^[0-9a-f]{32}$/);
  });
});
