import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { ClientStellarSigner } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { getStellarNetworkKey } from "~/lib/stellarConfig";

function isInsufficientBalanceSimulationError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("resulting balance is not within the allowed range");
}

const STELLAR_EXPERT_TX: Record<string, string> = {
  testnet: "https://stellar.expert/explorer/testnet/tx",
  mainnet: "https://stellar.expert/explorer/public/tx",
};

export type BrowserPaidFetchResult = {
  status: number;
  bodyText: string;
  contentType: string | null;
  transaction?: string;
  transactionUrl?: string;
};

/**
 * Browser x402 paid fetch: 402 → build payment with user signer → retry with payment headers.
 */
export async function paidFetchWithSigner(
  url: string,
  init: RequestInit,
  signer: ClientStellarSigner,
): Promise<BrowserPaidFetchResult> {
  const coreClient = new x402Client().register("stellar:*", new ExactStellarScheme(signer));
  const client = new x402HTTPClient(coreClient);
  const method = (init.method ?? "GET").toUpperCase();
  const initialResponse = await fetch(url, { ...init, method });

  if (initialResponse.status !== 402) {
    const bodyText = await initialResponse.text();
    return {
      status: initialResponse.status,
      bodyText,
      contentType: initialResponse.headers.get("content-type"),
    };
  }

  const paymentRequired = client.getPaymentRequiredResponse(
    (name: string) => initialResponse.headers.get(name),
    await initialResponse.json(),
  );

  const accepted = paymentRequired.accepts[0];
  if (!accepted) {
    throw new Error("402 response had no acceptable payment options");
  }

  let paymentPayload;
  try {
    paymentPayload = await client.createPaymentPayload(paymentRequired);
  } catch (error) {
    if (isInsufficientBalanceSimulationError(error)) {
      const hint =
        getStellarNetworkKey() === "testnet"
          ? " Fund testnet USDC / XLM (e.g. Stellar Lab fund) and ensure USDC trustline."
          : "";
      throw new Error(`Insufficient balance for payment.${hint}`);
    }
    throw error;
  }

  const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);
  const paidResponse = await fetch(url, {
    ...init,
    method,
    headers: {
      ...(init.headers as Record<string, string>),
      ...paymentHeaders,
    },
  });

  const bodyText = await paidResponse.text();

  if (!paidResponse.ok) {
    throw new Error(`Paid request failed: ${paidResponse.status} ${bodyText.slice(0, 500)}`);
  }

  const settlement = client.getPaymentSettleResponse((name: string) => paidResponse.headers.get(name));
  const txHash = settlement.transaction;
  const netKey = getStellarNetworkKey();
  const txUrl = txHash ? `${STELLAR_EXPERT_TX[netKey]}/${txHash}` : undefined;

  return {
    status: paidResponse.status,
    bodyText,
    contentType: paidResponse.headers.get("content-type"),
    transaction: txHash,
    transactionUrl: txUrl,
  };
}
