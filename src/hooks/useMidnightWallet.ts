import { useCallback, useState } from "react";
import { connectWallet, WalletApi, WalletStatus } from "../lib/midnightWallet";

export function useMidnightWallet() {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletApi, setWalletApi] = useState<WalletApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    try {
      setStatus("connecting");
      const { address, walletName, api } = await connectWallet();
      setAddress(address);
      setWalletName(walletName);
      setWalletApi(api);
      setStatus("connected");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Wallet connection was declined.");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletName(null);
    setWalletApi(null);
    setStatus("disconnected");
  }, []);

  return { status, address, walletName, walletApi, error, connect, disconnect };
}
