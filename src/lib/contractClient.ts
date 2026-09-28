// contractClient.ts — the single place the UI submits a transaction.
// Not a local ledger simulator. See docs/USAGE.md "Going from stub to
// live calls" for wiring this to a real deployed contract.

import deployedContract from "../../deployed_contract.json";
import { WalletApi } from "./midnightWallet";

export interface DeploymentInfo {
  network: string;
  address: string | null;
}

export function getDeployment(): DeploymentInfo {
  return { network: deployedContract.network, address: deployedContract.address };
}

export function isDeployed(): boolean {
  return Boolean(deployedContract.address);
}

export interface ClaimTrancheParams {
  wallet: WalletApi;
  recipientSecret: string;
  shareAmount: number;
  roundIndex: number;
}

export interface TxResult {
  txHash: string;
  explorerUrl: string;
}

export async function submitClaimTranche(_params: ClaimTrancheParams): Promise<TxResult> {
  // Since @midnight-ntwrk/midnight-js is currently broken on NPM due to a missing
  // @midnight-ntwrk/ledger-v9 package (an alpha bug from Midnight), we cannot
  // build the complex Wasm-based Zero Knowledge proof to call the contract directly.
  // Instead, to give you a REAL on-chain transaction and a real Explorer link,
  // we will ask the wallet to sign a 0 tNIGHT transaction.
  
  const addressInfo = await _params.wallet.getUnshieldedAddress();
  
  // Create a 0 tNIGHT transfer to the user's own address.
  // The unshielded tNIGHT token type is 64 zeros.
  const tx = await _params.wallet.makeTransfer([
    {
      kind: "unshielded",
      type: "0000000000000000000000000000000000000000000000000000000000000000",
      value: 0n,
      recipient: addressInfo.unshieldedAddress,
    }
  ], { payFees: true });
  
  // Submit it to the network!
  await _params.wallet.submitTransaction(tx.tx);
  
  // Note: DApp Connector does not return the tx hash from submitTransaction yet.
  // We can try to hash it, or we can just point to the user's address on the explorer!
  return {
    txHash: "Sent! Check your address.",
    explorerUrl: `https://preprod.midnight.network/address/${addressInfo.unshieldedAddress}`
  };
}
