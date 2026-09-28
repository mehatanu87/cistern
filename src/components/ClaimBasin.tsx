import { useState } from "react";
import { randomSecretHex, isRoundVested } from "../lib/crypto";
import { submitClaimTranche, isDeployed } from "../lib/contractClient";
import { WalletApi } from "../lib/midnightWallet";

type Phase = "no-secret" | "ready" | "proving" | "error";

const TOTAL_ROUNDS = 6;
const CURRENT_ROUND = 3; // demo fixture: awaiting real ledger read once deployed

export function ClaimBasin({
  walletApi, walletConnected,
}: { walletApi: WalletApi | null; walletConnected: boolean }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [shareAmount, setShareAmount] = useState<number>(2500);
  const [roundIndex, setRoundIndex] = useState<number>(1);
  const [phase, setPhase] = useState<Phase>("no-secret");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleGenerateSecret() {
    setSecret(randomSecretHex());
    setPhase("ready");
  }

  async function handleClaim() {
    if (!secret || !walletApi) return;
    setPhase("proving");
    setErrorMsg(null);
    try {
      const res = await submitClaimTranche({ wallet: walletApi, recipientSecret: secret, shareAmount, roundIndex });
      setPhase("ready");
      setErrorMsg(`Success! Transaction ID: ${res.txHash} (view on explorer)`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "The claim could not be submitted.");
      setPhase("error");
    }
  }

  const vested = isRoundVested(roundIndex, CURRENT_ROUND, TOTAL_ROUNDS);
  const waterHeightPct = Math.round((CURRENT_ROUND / TOTAL_ROUNDS) * 100);

  return (
    <div className="border border-sand/10 rounded-sm overflow-hidden">
      <div className="p-8">
        <p className="font-mono text-[11px] tracking-wide text-sand/40">cistern · contributor pool, 6 rounds</p>
        <h2 className="font-display text-2xl text-sand mt-1 mb-6">Draw only what has filled.</h2>

        <div className="mb-6 relative h-24 rounded-sm border border-sand/15 overflow-hidden bg-depth-light">
          <div
            className="water-rise absolute bottom-0 left-0 right-0 bg-water/40"
            style={{ height: `${waterHeightPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-sand/60">round {CURRENT_ROUND} of {TOTAL_ROUNDS} vested</span>
          </div>
        </div>

        {!walletConnected ? (
          <p className="text-sm text-sand/60 leading-relaxed">
            Connect a Midnight wallet above to begin. Your recipient secret is generated on your device — it never leaves it.
          </p>
        ) : phase === "no-secret" ? (
          <div className="space-y-4">
            <p className="text-sm text-sand/70 leading-relaxed">
              Generate a recipient secret and enter your allocated share
              amount. For a claim to succeed for real, this exact
              (secret, amount) pair must already be part of the pool's
              recipient root at deployment time — see docs/USAGE.md.
            </p>
            <input
              type="number"
              value={shareAmount}
              onChange={(e) => setShareAmount(Number(e.target.value))}
              className="w-full bg-depth-light border border-sand/15 rounded-sm px-3 py-2 text-sm text-sand focus:border-water/50 outline-none"
              placeholder="your allocated share amount"
            />
            <button onClick={handleGenerateSecret} className="w-full font-mono text-sm bg-sand text-depth rounded-sm py-3 hover:bg-sand/90 transition-colors">
              generate recipient secret
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoundIndex(r)}
                  disabled={r > CURRENT_ROUND}
                  className={`font-mono text-xs rounded-sm py-2.5 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    roundIndex === r ? "border-water text-water-light bg-water/10" : "border-sand/15 text-sand/60 hover:border-sand/30"
                  }`}
                >
                  R{r}
                </button>
              ))}
            </div>

            {errorMsg && (
              <p className="text-sm text-water-light border border-water/30 bg-water/5 rounded-sm px-3 py-2 leading-relaxed">{errorMsg}</p>
            )}

            <button
              onClick={handleClaim}
              disabled={phase === "proving" || !isDeployed() || !vested}
              className="ripple relative w-full font-mono text-sm bg-water text-depth-deep rounded-sm py-3.5 hover:bg-water-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title={!isDeployed() ? "No contract deployed yet — see the banner above" : undefined}
            >
              {phase === "proving" ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-depth-deep/30 border-t-depth-deep animate-spin" />
                  generating proof…
                </>
              ) : `claim round ${roundIndex}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
