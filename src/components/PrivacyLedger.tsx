export function PrivacyLedger() {
  return (
    <div className="border border-sand/12 rounded-sm p-6">
      <h3 className="font-display text-lg text-sand mb-4">What an observer can see</h3>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className="font-mono text-[11px] text-stone-light mb-2">public</p>
          <ul className="space-y-1.5 text-sm text-sand/75">
            <li>· the pool's label and total vesting rounds</li>
            <li>· the current round unlocked for claiming</li>
            <li>· how many claims have been made, total</li>
            <li>· the set of spent claim nullifiers</li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] text-water-light mb-2">private</p>
          <ul className="space-y-1.5 text-sm text-sand/75">
            <li>· each recipient's identity</li>
            <li>· each recipient's exact share amount</li>
            <li>· the running total actually paid out</li>
            <li>· which recipient claimed which round</li>
          </ul>
        </div>
      </div>
      <div className="mt-5 pt-5 border-t border-sand/10">
        <p className="text-sm text-sand/60 leading-relaxed">
          Each claim proves, in zero-knowledge, that the caller is an
          allocated recipient and the round has vested —{" "}
          <em className="not-italic text-sand/80">without revealing who they are or how much they received</em>.
        </p>
      </div>
    </div>
  );
}
