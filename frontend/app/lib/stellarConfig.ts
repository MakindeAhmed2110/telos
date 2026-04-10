import { STELLAR_PUBNET_CAIP2, STELLAR_TESTNET_CAIP2 } from "@x402/stellar";

export type StellarNetworkKey = "testnet" | "mainnet";

export function getStellarNetworkKey(): StellarNetworkKey {
  const raw = (import.meta.env.VITE_STELLAR_NETWORK as string | undefined)?.trim().toLowerCase();
  return raw === "mainnet" ? "mainnet" : "testnet";
}

/** CAIP-2 id for @x402/stellar `createEd25519Signer`. */
export function getStellarCaip2Network(): typeof STELLAR_TESTNET_CAIP2 | typeof STELLAR_PUBNET_CAIP2 {
  return getStellarNetworkKey() === "mainnet" ? STELLAR_PUBNET_CAIP2 : STELLAR_TESTNET_CAIP2;
}

/** Stellar network passphrase (matches StellarWalletsKit `Networks` enum values). */
export function getStellarNetworkPassphrase(): string {
  return getStellarNetworkKey() === "mainnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";
}

export const STELLAR_LAB_FUND_TESTNET =
  "https://lab.stellar.org/account/fund?$=network$id=testnet&label=Testnet&horizonUrl=https://horizon-testnet.stellar.org&rpcUrl=https://soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;;";
