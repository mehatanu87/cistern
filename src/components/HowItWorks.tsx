import { useEffect, useState } from "react";

const steps = [
  {
    id: "01",
    icon: "◈",
    title: "Sponsor commits",
    detail: "A sponsor publishes a Merkle root — a cryptographic fingerprint of all recipients and share amounts. No individual amounts are ever on-chain.",
    color: "text-blue-400",
    border: "border-blue-400/30",
    glow: "shadow-blue-500/10",
  },
  {
    id: "02",
    icon: "◎",
    title: "Rounds vest",
    detail: "The sponsor advances the public round counter. Each advance unlocks a new tranche for claiming — without revealing who gets what.",
    color: "text-indigo-400",
    border: "border-indigo-400/30",
    glow: "shadow-indigo-500/10",
  },
  {
    id: "03",
    icon: "◉",
    title: "Recipient claims in ZK",
    detail: "Recipients prove — in zero-knowledge — that they are allocated and haven't claimed this round yet. Only a claim count is ever public. Identity and amount stay private.",
    color: "text-teal-400",
    border: "border-teal-400/30",
    glow: "shadow-teal-500/10",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % steps.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="mb-10">
      <p className="font-mono text-[11px] text-sand/35 mb-3 uppercase tracking-widest">How it works</p>
      <div className="grid gap-3">
        {steps.map((s, i) => {
          const isActive = active === i;
          return (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`text-left w-full rounded border p-4 transition-all duration-500 ${
                isActive
                  ? `${s.border} bg-white/5 shadow-lg ${s.glow}`
                  : "border-sand/10 bg-transparent hover:bg-white/3"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className={`font-mono text-2xl leading-none mt-0.5 transition-all duration-500 ${isActive ? s.color : "text-sand/20"}`}>
                  {s.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] transition-colors duration-300 ${isActive ? s.color : "text-sand/25"}`}>{s.id}</span>
                    <span className={`font-display text-sm transition-colors duration-300 ${isActive ? "text-sand" : "text-sand/40"}`}>{s.title}</span>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-500"
                    style={{ maxHeight: isActive ? "80px" : "0px", opacity: isActive ? 1 : 0 }}
                  >
                    <p className="text-sand/55 text-[13px] leading-relaxed pr-2">{s.detail}</p>
                  </div>
                </div>
                <span className={`font-mono text-[10px] self-center transition-colors duration-300 ${isActive ? s.color : "text-sand/15"}`}>
                  {isActive ? "▶" : "○"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
