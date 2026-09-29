// contractClient.ts — real on-chain claimTranche circuit call using
// the compiled managed/ bindings + Midnight.js SDK providers.
// The wallet's DApp Connector handles fee balancing and submission.

/* eslint-disable @typescript-eslint/no-explicit-any */

import deployedContract from "../../deployed_contract.json";
import { WalletApi } from "./midnightWallet";

// Midnight.js SDK
import {
  createUnprovenCallTx,
  submitTxAsync,
} from "@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { fromHex, toHex } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { inMemoryPrivateStateProvider } from "./inMemoryPrivateStateProvider";
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

// Generated contract bindings from compact compile
import {
  Contract,
  type Witnesses,
  type Ledger,
  contractReferenceLocations,
} from "../../contracts/managed/cistern/contract/index.js";

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { UnboundTransaction } from "@midnight-ntwrk/midnight-js-types";

// -----------------------------------------------------------------------
// Deployment helpers
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// Private state type
// -----------------------------------------------------------------------

export type CisternPrivateState = {
  secretBytes: Uint8Array;
  amount: bigint;
};

function makeWitnesses(_state: CisternPrivateState): Witnesses<CisternPrivateState> {
  return {
    recipientSecret: ({ privateState }: WitnessContext<Ledger, CisternPrivateState>) =>
      [privateState, privateState.secretBytes],
    shareAmount: ({ privateState }: WitnessContext<Ledger, CisternPrivateState>) =>
      [privateState, privateState.amount],
    // Depth-10 Merkle path with all siblings = 0.
    // For a single-recipient pool the sponsor sets root = leaf, so
    // a path of all left-siblings = 0 validates correctly.
    recipientPath: ({ privateState }: WitnessContext<Ledger, CisternPrivateState>) => [
      privateState,
      {
        leaf: privateState.secretBytes,
        path: Array.from({ length: 10 }, () => ({
          sibling: { field: 0n },
          goes_left: false,
        })),
      },
    ],
  };
}

// -----------------------------------------------------------------------
// Wallet provider adapters (DApp Connector → Midnight.js providers)
// -----------------------------------------------------------------------

async function buildProviders(walletApi: WalletApi, config: Awaited<ReturnType<WalletApi["getConfiguration"]>>) {
  const publicDataProvider = indexerPublicDataProvider(
    config.indexerUri,
    config.indexerWsUri,
    globalThis.WebSocket as any
  );

  const zkConfigProvider = new FetchZkConfigProvider(
    window.location.origin,
    { fetchFunc: fetch.bind(window) },
  );

  const proofProvider = httpClientProofProvider(config.proverServerUri || "http://127.0.0.1:6300", zkConfigProvider);
  
  const privateStateProvider = inMemoryPrivateStateProvider<string, CisternPrivateState>();

  const shieldedAddresses = await walletApi.getShieldedAddresses();

  const walletProvider = {
    getCoinPublicKey(): string { return shieldedAddresses.shieldedCoinPublicKey; },
    getEncryptionPublicKey(): string { return shieldedAddresses.shieldedEncryptionPublicKey; },
    balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
      const balanced = await walletApi.balanceUnsealedTransaction(toHex(tx.serialize()));
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
        "signature", "proof", "binding",
        fromHex(balanced.tx),
      );
    },
  };

  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction): Promise<string> => {
      await walletApi.submitTransaction(toHex(tx.serialize()));
      return tx.identifiers()[0]!;
    },
  };

  return { publicDataProvider, zkConfigProvider, walletProvider, midnightProvider, proofProvider, privateStateProvider };
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

export interface ClaimTrancheParams {
  wallet: WalletApi;
  recipientSecret: string; // 32-byte hex string
  shareAmount: number;
  roundIndex: number;
}

export interface TxResult {
  txHash: string;
  explorerUrl: string;
}

export async function submitClaimTranche(params: ClaimTrancheParams): Promise<TxResult> {
  if (!isDeployed()) {
    throw new Error("No contract deployed — fill in deployed_contract.json.");
  }

  // Set the correct network ID for the Midnight SDK (e.g. "preprod")
  setNetworkId(deployedContract.network);

  const config = await params.wallet.getConfiguration();
  const providers = await buildProviders(params.wallet, config);

  providers.privateStateProvider.setContractAddress(deployedContract.address as any);

  // Decode hex secret into bytes
  const secretHex = params.recipientSecret.replace(/^0x/, "");
  const secretBytes = new Uint8Array(
    secretHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );

  const initialPrivateState: CisternPrivateState = {
    secretBytes,
    amount: BigInt(params.shareAmount),
  };

  class BoundContract extends Contract<CisternPrivateState> {
    constructor() {
      super(makeWitnesses(initialPrivateState));
    }
  }

  // Build compiled contract with ZK file assets
  const compiledContract = CompiledContract.make("cistern", BoundContract as any)
    .pipe(CompiledContract.withCompiledFileAssets(contractReferenceLocations)) as any;

  // The SDK expects the private state to already exist in the provider under the ID we specify
  await providers.privateStateProvider.set("cistern", initialPrivateState);

  try {
    console.log("[ClaimTranche] Starting unproven call tx creation...");
    // Build the unproven claimTranche call transaction
    const callTxData = await createUnprovenCallTx(providers as any, {
      compiledContract,
      circuitId: "claimTranche",
      contractAddress: deployedContract.address as any,
      privateStateId: "cistern",
      args: [BigInt(params.roundIndex)] as any,
    } as any);

    console.log("[ClaimTranche] txData created. Submitting via wallet...");

    // Prove, balance via wallet, and submit
    const txId = await submitTxAsync(providers as any, {
      unprovenTx: (callTxData as any).private.unprovenTx,
      circuitId: "claimTranche",
    });

    console.log("[ClaimTranche] Success! TxId:", txId);
    return {
      txHash: txId,
      explorerUrl: `https://preprod.midnight.network/transaction/${txId}`,
    };
  } catch (error) {
    console.error("[ClaimTranche] Error occurred:", error);
    throw error;
  }
}
