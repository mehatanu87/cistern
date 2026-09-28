import { DeploymentInfo } from "../lib/contractClient";

const EXPLORER_BASE = "https://preprod.midnight.network/contract/";

export function DeploymentBanner({ deployment }: { deployment: DeploymentInfo }) {
  if (deployment.address) {
    return (
      <div className="border border-stone/30 bg-stone/5 rounded-sm px-4 py-3 text-sm text-sand/80 flex flex-wrap items-center gap-2 mb-8">
        <span className="text-green-400">●</span>
        <span>Live on <strong>{deployment.network}</strong> —{" "}
          <a
            href={`${EXPLORER_BASE}${deployment.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-sand/70 underline hover:text-sand"
          >
            {deployment.address.slice(0, 12)}…{deployment.address.slice(-8)}
          </a>
        </span>
      </div>
    );
  }
  return (
    <div className="border border-water/30 bg-water/5 rounded-sm px-4 py-3 text-sm text-sand/80 mb-8">
      <p className="flex items-center gap-2 text-water-light">
        <span>●</span><span className="font-medium">Not yet deployed to Preprod</span>
      </p>
      <p className="text-sand/55 text-[13px] mt-1 leading-relaxed">
        Claims below require a real deployed contract and a connected wallet — there is no simulated ledger in this build. Run{" "}
        <code className="font-mono text-sand/70">compact compile</code>, deploy, and fill in{" "}
        <code className="font-mono text-sand/70">deployed_contract.json</code> (see docs/USAGE.md) to enable live claims.
      </p>
    </div>
  );
}
