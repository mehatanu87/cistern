import { Header } from "./components/Header";
import { DeploymentBanner } from "./components/DeploymentBanner";
import { ClaimBasin } from "./components/ClaimBasin";
import { PoolLedger } from "./components/PoolLedger";
import { useMidnightWallet } from "./hooks/useMidnightWallet";
import { getDeployment } from "./lib/contractClient";

function App() {
  const wallet = useMidnightWallet();
  const deployment = getDeployment();

  return (
    <div className="min-h-screen bg-depth flex flex-col">
      <Header status={wallet.status} address={wallet.address} walletName={wallet.walletName} error={wallet.error} onConnect={wallet.connect} onDisconnect={wallet.disconnect} />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
        <section className="mb-8">
          <p className="font-mono text-[11px] text-sand/40 mb-3">🌓 first quarter — half light, half shadow</p>
          <h1 className="font-display text-3xl sm:text-4xl text-sand leading-tight max-w-xl">Everyone's share fills at their own rate. No one sees the gauge but them.</h1>
          <p className="text-sand/60 mt-3 max-w-lg leading-relaxed">
            Cistern releases confidential vesting tranches over rounds. Every claim is a real transaction, checked against a deployed Midnight contract, never simulated locally.
          </p>
        </section>
        <DeploymentBanner deployment={deployment} />
        <section className="mb-10">
          <ClaimBasin walletApi={wallet.walletApi} walletConnected={wallet.status === "connected"} />
        </section>
        <section className="mb-10">
            <PoolLedger />
          </section>
      </main>
      <footer className="border-t border-sand/10">
        <div className="mx-auto max-w-3xl px-6 py-6 flex flex-col sm:flex-row justify-between gap-2">
          <p className="font-mono text-[11px] text-sand/35">built on midnight · compact contracts</p>
          <p className="font-mono text-[11px] text-sand/35">level 3 · first quarter submission</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
