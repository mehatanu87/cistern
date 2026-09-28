# Cistern
![CI](https://github.com/mehatanu87/cistern/actions/workflows/ci.yml/badge.svg)
> Confidential vesting — claims released over rounds. Built on Midnight.

## Live Demo
[https://cistern.vercel.app](https://cistern.vercel.app)

## Contract Address
| Network  | Address                                                            |
|----------|--------------------------------------------------------------------|
| Preprod  | [`bde9e76ccc9fdf2662d1872b8d6b7916a98b04f19ee0194bc18f3d4779dd47b0`](https://preprod.midnight.network/contract/bde9e76ccc9fdf2662d1872b8d6b7916a98b04f19ee0194bc18f3d4779dd47b0) |

## What This Does
Cistern distributes a pool of funds to allocated recipients across a
vesting schedule of discrete rounds. A sponsor publishes a Merkle root
committing every recipient's (secret, share amount) pair; as rounds
advance, recipients prove they're entitled to a share and haven't
already claimed a given round — without ever disclosing their identity
or how much they received. Only a claim count is ever public; the
running total actually paid out is never summed on-chain.

## No mock data — architecture note
This build has **no local ledger simulator**. `src/lib/contractClient.ts`
refuses to fabricate a transaction result: every action either goes
through a connected wallet against a real deployed contract, or the UI
tells you plainly that nothing is deployed yet. See docs/USAGE.md for
the exact steps to wire it up to a live Preprod deployment.

## Privacy Model
- **PUBLIC:** the pool's label and total vesting rounds, the current
  unlocked round, the total claim count, the set of spent nullifiers,
  open/closed status.
- **PRIVATE:** each recipient's identity, their exact share amount, the
  running total actually paid out, and which recipient claimed which
  round.
- **PROVED without revealing:** that the caller is an allocated
  recipient, the round being claimed has vested, and they haven't
  claimed it already — without revealing who they are or their share.

## Privacy Claim
An on-chain observer can see exactly how many claims have been made at
any point and confirm no recipient double-claimed a round (the
nullifier set only grows). What they cannot see, at any point, is any
individual's share amount, identity, or the running total actually
disbursed — the ledger never sums claimed amounts, only counts claims.

## Tech Stack
- **Contract:** Compact (`contracts/cistern.compact`)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Wallet:** Midnight DApp Connector API (multi-wallet detection)
- **Tests:** Vitest, covering the pure witness-derivation helpers
- **CI/CD:** GitHub Actions

## Prerequisites
- Node.js v22+, npm
- [Midnight `compact` CLI](https://docs.midnight.network)
- A Midnight-compatible wallet (Lace or 1AM), funded on Preprod

## Setup & Run Locally
```bash
npm install
npm run compact:compile   # requires the Midnight toolchain
npm run dev
```
Until `deployed_contract.json` has a real address and
`src/lib/contractClient.ts`'s live-call section is wired to your
compiled `managed/cistern` bindings (see docs/USAGE.md), the app runs
but honestly reports that no contract is deployed rather than
simulating one.

## Run Tests
```
npm test
```

## CI/CD
On every push and pull request to `main`, the GitHub Actions pipeline
checks out the code, installs dependencies on Node 22, compiles the
Compact contract when the toolchain is present, lints, runs the full
Vitest suite, and produces a production build.

## Product Proposal
See [PROPOSAL.md](./PROPOSAL.md).
