import { WalletStatus } from "../lib/midnightWallet";

function truncate(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function Header({
  status, address, walletName, error, onConnect, onDisconnect,
}: {
  status: WalletStatus;
  address: string | null;
  walletName: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <header className="border-b border-sand/10">
      <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 64 64" className="shrink-0">
            <rect x="16" y="14" width="32" height="38" rx="2" fill="none" stroke="#E9E4D8" strokeWidth="2" />
            <rect x="18" y="34" width="28" height="16" fill="#3A8FB7" opacity="0.6" />
          </svg>
          <div>
            <p className="font-display text-xl text-sand leading-none">Cistern</p>
            <p className="font-mono text-[11px] text-sand/45 mt-1">first quarter · midnight builder challenge</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {status === "connected" && address ? (
            <button onClick={onDisconnect} className="font-mono text-xs text-stone-light border border-stone/40 rounded px-3 py-1.5 hover:bg-stone/10 transition-colors">
              {walletName ?? "wallet"} · {truncate(address)}
            </button>
          ) : (
            <button onClick={onConnect} disabled={status === "connecting"} className="font-mono text-xs text-sand border border-sand/25 rounded px-3 py-1.5 hover:border-water hover:text-water-light transition-colors disabled:opacity-50">
              {status === "connecting" ? "connecting…" : "connect wallet"}
            </button>
          )}
          {status === "unavailable" && <p className="text-[11px] text-sand/40 max-w-[240px] text-right">{error}</p>}
          {status === "error" && error && <p className="text-[11px] text-water-light max-w-[240px] text-right">{error}</p>}
        </div>
      </div>
    </header>
  );
}
