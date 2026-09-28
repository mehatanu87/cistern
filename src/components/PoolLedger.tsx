import { isDeployed } from "../lib/contractClient";

export function PoolLedger() {
  const deployed = isDeployed();
  return (
    <div className="border border-sand/12 rounded-sm p-6">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="font-display text-lg text-sand">Pool ledger</h3>
        <span className="font-mono text-[11px] text-sand/40">{deployed ? "live · on-chain" : "awaiting deployment"}</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-sand/70">Current round</span>
          <span className="font-mono text-xs text-sand/40">{deployed ? "reads from managed/cistern" : "—"}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-sand/70">Total claims made</span>
          <span className="font-mono text-xs text-sand/40">{deployed ? "reads from managed/cistern" : "—"}</span>
        </div>
      </div>
      <p className="font-mono text-[11px] text-sand/35 mt-5 pt-5 border-t border-sand/10">
        Only a claim count is ever public — no running total amount is summed on-chain.
      </p>
    </div>
  );
}
