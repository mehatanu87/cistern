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

export function listInjectedWallets(): Array<{ id: string; wallet: InjectedWallet }> {
  if (typeof window === "undefined" || !window.midnight) return [];
  return Object.entries(window.midnight)
    .filter(([, w]) => w && typeof w.enable === "function")
    .map(([id, wallet]) => ({ id, wallet }));
}

export async function connectWallet(walletId?: string): Promise<{
  address: string;
  walletName: string;
  api: WalletApi;
  serviceUriConfig?: { nodeUri: string; indexerUri: string; proverServerUri: string };
}> {
  // Give the wallet extension a moment to inject itself
  await new Promise((r) => setTimeout(r, 300));

  const wallets = listInjectedWallets();
  if (wallets.length === 0) {
    throw new Error(
      "No Midnight-compatible wallet detected. Install Lace or 1AM Wallet, configure it for Preprod, and reload the page."
    );
  }

  const target = walletId
    ? wallets.find((w) => w.id === walletId)
    : wallets[0];

  if (!target) throw new Error("The requested wallet is not installed.");

  // enable() returns the WalletApi
  const api = await target.wallet.enable();
  if (!api || typeof api.state !== "function") {
    throw new Error(
      `Wallet "${target.wallet.name}" did not return a valid API. Make sure it is unlocked and on Preprod.`
    );
  }

  const state = await api.state();
  const serviceUriConfig = api.serviceUriConfig ? await api.serviceUriConfig() : undefined;
  return { address: state.address, walletName: target.wallet.name, api, serviceUriConfig };
}
