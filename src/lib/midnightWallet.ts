// midnightWallet.ts — real Midnight DApp Connector API integration.
// Wallets (Lace, 1AM) inject themselves onto `window.midnight` as a
// flat object keyed by wallet id. Each entry is an InjectedWallet object.

export interface InjectedWallet {
  name: string;
  apiVersion: string;
  icon: string;
  rdns: string;
  connect: (networkId: string) => Promise<WalletApi>;
}

export interface WalletApi {
  getUnshieldedAddress: () => Promise<{ unshieldedAddress: string }>;
  getConfiguration: () => Promise<{ nodeUri?: string; indexerUri: string; proverServerUri?: string; substrateNodeUri?: string }>;
  makeTransfer: (desiredOutputs: Array<{ kind: 'shielded' | 'unshielded'; type: string; value: bigint; recipient: string }>, options?: { payFees?: boolean }) => Promise<{ tx: string }>;
  submitTransaction: (tx: string) => Promise<void>;
}

declare global {
  interface Window {
    midnight?: Record<string, InjectedWallet>;
  }
}

export type WalletStatus = "disconnected" | "connecting" | "connected" | "unavailable" | "error";

/** Poll window.midnight until at least one valid wallet appears, or timeout. */
async function pollForWallets(timeoutMs = 3000, intervalMs = 150): Promise<Array<{ id: string; wallet: InjectedWallet }>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = listInjectedWallets();
    if (found.length > 0) return found;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return [];
}

export function listInjectedWallets(): Array<{ id: string; wallet: InjectedWallet }> {
  if (typeof window === "undefined" || !window.midnight) return [];
  return Object.entries(window.midnight)
    .filter(([, w]) => w && typeof w === "object" && typeof (w as InjectedWallet).connect === "function")
    .map(([id, wallet]) => ({ id, wallet: wallet as InjectedWallet }));
}

export async function connectWallet(walletId?: string): Promise<{
  address: string;
  walletName: string;
  api: WalletApi;
  serviceUriConfig?: { nodeUri: string; indexerUri: string; proverServerUri: string; substrateNodeUri: string };
}> {
  // Poll for up to 3 seconds — extensions inject asynchronously after page load
  const wallets = await pollForWallets(3000);

  if (wallets.length === 0) {
    throw new Error(
      "No Midnight-compatible wallet detected. Install the 1AM Wallet or Lace extension, make sure it is configured for the Preprod network, then reload the page."
    );
  }

  const target = walletId
    ? wallets.find((w) => w.id === walletId)
    : wallets[0];

  if (!target) throw new Error("The requested wallet is not installed.");

  // connect() prompts the user and returns the WalletApi
  const api = await target.wallet.connect("preprod");
  if (!api || typeof api.getUnshieldedAddress !== "function") {
    throw new Error(
      `Wallet "${target.wallet.name}" did not return a valid API. Make sure it is unlocked and set to Preprod.`
    );
  }

  const state = await api.getUnshieldedAddress();
  const config = api.getConfiguration ? await api.getConfiguration() : undefined;
  
  const serviceUriConfig = config ? {
    nodeUri: config.substrateNodeUri || config.nodeUri || "",
    indexerUri: config.indexerUri || "",
    proverServerUri: config.proverServerUri || "",
    substrateNodeUri: config.substrateNodeUri || ""
  } : undefined;

  return { address: state.unshieldedAddress, walletName: target.wallet.name, api, serviceUriConfig };
}
