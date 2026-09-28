// midnightWallet.ts — real Midnight DApp Connector API integration.
// Wallets (Lace, 1AM) inject themselves onto `window.midnight` as a
// flat object keyed by wallet id. Each entry is an InjectedWallet object
// with name, apiVersion, isEnabled(), and enable().
// Reference: https://docs.midnight.network/blog/connect-dapp-lace-wallet

export interface InjectedWallet {
  name: string;
  apiVersion: string;
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<WalletApi>;
}

export interface WalletApi {
  state: () => Promise<{ address: string }>;
  serviceUriConfig?: () => Promise<{ nodeUri: string; indexerUri: string; proverServerUri: string }>;
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
    .filter(([, w]) => w && typeof w === "object" && typeof (w as InjectedWallet).enable === "function")
    .map(([id, wallet]) => ({ id, wallet: wallet as InjectedWallet }));
}

export async function connectWallet(walletId?: string): Promise<{
  address: string;
  walletName: string;
  api: WalletApi;
  serviceUriConfig?: { nodeUri: string; indexerUri: string; proverServerUri: string };
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

  // enable() prompts the user and returns the WalletApi
  const api = await target.wallet.enable();
  if (!api || typeof api.state !== "function") {
    throw new Error(
      `Wallet "${target.wallet.name}" did not return a valid API. Make sure it is unlocked and set to Preprod.`
    );
  }

  const state = await api.state();
  const serviceUriConfig = api.serviceUriConfig ? await api.serviceUriConfig() : undefined;
  return { address: state.address, walletName: target.wallet.name, api, serviceUriConfig };
}
