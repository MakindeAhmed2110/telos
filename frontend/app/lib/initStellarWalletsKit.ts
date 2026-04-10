import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit-tech/stellar-wallets-kit/types";
import { getStellarNetworkKey } from "~/lib/stellarConfig";

let initialized = false;

/** Call once in the browser before `authModal` / `signAuthEntry`. Safe to call multiple times. */
export function initStellarWalletsKit(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  const network = getStellarNetworkKey() === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network,
  });
}
