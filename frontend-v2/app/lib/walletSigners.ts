import type { ClientStellarSigner } from "@x402/stellar";

/**
 * SEP-43 signer backed by the active Stellar Wallets Kit module (e.g. Freighter).
 * User approves each Soroban auth entry the x402 client needs (payment simulation).
 * Kit is loaded dynamically so SSR / Node never pulls `@stellar/freighter-api`.
 */
export function createWalletsKitClientSigner(
  address: string,
  defaultNetworkPassphrase: string,
): ClientStellarSigner {
  return {
    address,
    signAuthEntry: async (authEntry, opts) => {
      const { StellarWalletsKit } = await import("@creit-tech/stellar-wallets-kit/sdk");
      const { signedAuthEntry, signerAddress } = await StellarWalletsKit.signAuthEntry(authEntry, {
        networkPassphrase: opts?.networkPassphrase ?? defaultNetworkPassphrase,
        address: opts?.address ?? address,
      });
      return {
        signedAuthEntry,
        signerAddress: signerAddress ?? address,
      };
    },
  };
}
