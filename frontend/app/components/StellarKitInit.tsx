import { useEffect } from "react";

/** Initializes Stellar Wallets Kit once on the client (required before connect / sign). */
export default function StellarKitInit() {
  useEffect(() => {
    void import("~/lib/initStellarWalletsKit").then((m) => m.initStellarWalletsKit());
  }, []);
  return null;
}
