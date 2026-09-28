# Usage notes

## Circuit walkthrough (`contracts/cistern.compact`)

- `createPool(label, numRounds, root)` — sponsor opens the pool, sets
  the vesting horizon (1-12 rounds), and publishes the Merkle root of
  every recipient's `(secret, shareAmount)` commitment.
- `advanceRound()` — sponsor unlocks the next tranche; this reveals
  nothing beyond which round number is now claimable.
- `claimTranche(roundIndex)` — a recipient supplies three private
  witnesses (`recipientSecret`, `shareAmount`, `recipientPath`). The
  circuit proves allocation membership, checks the round has vested,
  derives a round-scoped nullifier, checks it hasn't been spent, then
  increments only the public `totalClaims` counter.
- `closePool()` — freezes further rounds and claims.

## Going from stub to live calls (real on-chain transactions)

This repo ships with **no simulated ledger**. `src/lib/contractClient.ts`
throws until you complete this wiring.

1. Run `npm run compact:compile` to populate `managed/cistern`.
2. Build the recipient Merkle tree off-chain from real
   `(secret, shareAmount)` pairs, deploy with `createPool` against that
   root, and record the Preprod contract address in
   `deployed_contract.json` and `README.md`.
3. In `src/lib/contractClient.ts`, replace `submitClaimTranche`'s body
   with a real call against `managed/cistern`, using
   `@midnight-ntwrk/midnight-js-contracts`. Mirror Midnight's official
   `example-counter` reference dApp: https://docs.midnight.network
   (see "Examples").
4. Replace `ClaimBasin`'s hardcoded `CURRENT_ROUND`/`TOTAL_ROUNDS`
   fixtures with a real read of the deployed contract's public ledger
   state once step 3 is wired.

## Manual steps still required before submission

- [ ] Compile the contract and deploy to Preprod with a real recipient root
- [ ] Wire `submitClaimTranche` to the generated bindings (step 3 above)
- [ ] Add the real Preprod contract address to `README.md` and `deployed_contract.json`
- [ ] Fill in every `[I WILL FILL THIS IN]` section of `PROPOSAL.md`
- [ ] Submit the chosen idea (Private Payroll / Splits) for approval
- [ ] Record the 1-minute demo video showing a real transaction
- [ ] Make 10+ meaningful, incremental commits
- [ ] Deploy the frontend and add the live URL

## Demo video checklist
1. Full flow: connect a real wallet → generate a recipient secret →
   claim a vested round → show the transaction on a Preprod explorer
2. Terminal showing `npm test` output (14 passing)
3. README showing the green CI badge
