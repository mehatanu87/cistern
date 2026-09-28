import { useEffect, useRef } from "react";

const PUBLIC_ITEMS = [
  { label: "Pool label", value: "\"Pool 1\"" },
  { label: "Total rounds", value: "3" },
  { label: "Current round", value: "live" },
  { label: "Claim count", value: "counter" },
  { label: "Spent nullifiers", value: "set" },
  { label: "Open / closed", value: "boolean" },
];

const PRIVATE_ITEMS = [
  { label: "Recipient identity", value: "hidden" },
  { label: "Share amount", value: "hidden" },
  { label: "Who claimed round X", value: "hidden" },
  { label: "Total disbursed", value: "never summed" },
  { label: "Merkle tree leaves", value: "hidden" },
];

function Pip({ color, delay }: { color: string; delay: number }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${color} animate-pulse`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

export function PrivacyRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const t = frame / 120;

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner ring — public zone
      ctx.beginPath();
      ctx.arc(cx, cy, cx * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56,189,248,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rotating sweep line
      const angle = (t * Math.PI * 2) % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * (cx - 4), cy + Math.sin(angle) * (cx - 4));
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * (cx - 4), cy + Math.sin(angle) * (cx - 4));
      grad.addColorStop(0, "rgba(56,189,248,0)");
      grad.addColorStop(1, "rgba(56,189,248,0.5)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots — public (inner ring, steady)
      const publicDots = [0.2, 0.8, 1.5, 2.3, 3.5, 4.8];
      publicDots.forEach((a, i) => {
        const r = cx * 0.35 + Math.sin(t * 2 + i) * 4;
        const dx = cx + Math.cos(a) * r;
        const dy = cy + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56,189,248,0.7)";
        ctx.fill();
      });

      // Dots — private (outer ring, hidden/dim)
      const privateDots = [0.6, 1.2, 2.0, 3.0, 4.2];
      privateDots.forEach((a, i) => {
        const r = cx * 0.72 + Math.sin(t * 1.5 + i * 1.3) * 5;
        const dx = cx + Math.cos(a) * r;
        const dy = cy + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(148,163,184,0.2)";
        ctx.fill();
      });

      // Center label
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "rgba(233,228,216,0.4)";
      ctx.textAlign = "center";
      ctx.fillText("ZK", cx, cy + 4);

      frame++;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="mb-10">
      <p className="font-mono text-[11px] text-sand/35 mb-3 uppercase tracking-widest">Privacy model</p>
      <div className="rounded border border-sand/10 bg-white/3 p-5 flex flex-col sm:flex-row gap-6 items-start">
        {/* Radar */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <canvas ref={canvasRef} width={120} height={120} className="opacity-90" />
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-blue-400/70"><span className="w-2 h-2 rounded-full bg-blue-400/70 inline-block" /> public</span>
            <span className="flex items-center gap-1 text-sand/30"><span className="w-2 h-2 rounded-full bg-sand/20 inline-block" /> private</span>
          </div>
        </div>

        {/* Tables */}
        <div className="flex-1 grid sm:grid-cols-2 gap-4 min-w-0">
          <div>
            <p className="font-mono text-[10px] text-blue-400/70 mb-2 flex items-center gap-1.5">
              <Pip color="bg-blue-400" delay={0} /> Anyone can see
            </p>
            <div className="space-y-1.5">
              {PUBLIC_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-sand/50 text-[12px]">{item.label}</span>
                  <span className="font-mono text-[10px] text-blue-300/60 shrink-0">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] text-sand/30 mb-2 flex items-center gap-1.5">
              <Pip color="bg-sand/20" delay={200} /> No one can see
            </p>
            <div className="space-y-1.5">
              {PRIVATE_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-sand/30 text-[12px] line-through decoration-sand/15">{item.label}</span>
                  <span className="font-mono text-[10px] text-sand/20 shrink-0">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
