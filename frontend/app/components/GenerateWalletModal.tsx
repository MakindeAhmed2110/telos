import { Keypair } from "@stellar/stellar-sdk";
import { Copy, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "~/components/ui/Button";
import { STELLAR_LAB_FUND_TESTNET } from "~/lib/stellarConfig";
import { useTelosStore } from "~/store";

export default function GenerateWalletModal() {
  const { generateWalletModalOpen, closeGenerateWalletModal, confirmGeneratedWallet, addToast } = useTelosStore();
  const [pair, setPair] = useState<{ publicKey: string; secret: string } | null>(null);

  useEffect(() => {
    if (!generateWalletModalOpen) {
      setPair(null);
      return;
    }
    const kp = Keypair.random();
    setPair({ publicKey: kp.publicKey(), secret: kp.secret() });
  }, [generateWalletModalOpen]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast("success", `${label} copied.`);
    } catch {
      addToast("error", "Could not copy to clipboard.");
    }
  };

  if (!generateWalletModalOpen) return null;

  return (
    <div className="telos-modal-root" role="dialog" aria-modal="true" aria-labelledby="telos-gen-wallet-title">
      <button
        type="button"
        className="telos-modal-backdrop"
        aria-label="Close"
        onClick={closeGenerateWalletModal}
      />
      <div className="telos-modal-panel">
        <div className="telos-modal-panel__head">
          <h2 id="telos-gen-wallet-title" className="telos-modal-panel__title font-ui font-600">
            New Stellar wallet
          </h2>
          <button
            type="button"
            className="telos-modal-panel__close"
            onClick={closeGenerateWalletModal}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {!pair ? (
          <p className="font-ui text-sm text-[#9898b0]">Generating keypair…</p>
        ) : (
          <>
            <p className="font-ui text-[0.8125rem] text-[#9898b0] leading-relaxed" style={{ margin: "0 0 1rem" }}>
              Save your secret key offline. It is kept in this browser tab only until you disconnect. Fund the public
              address on testnet before sending paid prompts.
            </p>

            <div className="telos-modal-field">
              <div className="telos-modal-field__label-row">
                <span className="font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78]">Public address</span>
                <button
                  type="button"
                  className="telos-modal-copy"
                  onClick={() => void copy("Address", pair.publicKey)}
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              <pre className="telos-modal-pre">{pair.publicKey}</pre>
            </div>

            <div className="telos-modal-field">
              <div className="telos-modal-field__label-row">
                <span className="font-ui text-[0.625rem] uppercase tracking-wider text-[#ff3366]">Secret key</span>
                <button
                  type="button"
                  className="telos-modal-copy"
                  onClick={() => void copy("Secret key", pair.secret)}
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              <pre className="telos-modal-pre telos-modal-pre--secret">{pair.secret}</pre>
            </div>

            <a
              href={STELLAR_LAB_FUND_TESTNET}
              target="_blank"
              rel="noreferrer"
              className="telos-modal-fund-link font-ui text-sm text-[#ffba5c] inline-flex items-center gap-1.5 mt-2 hover:underline"
            >
              Open Stellar Lab — fund testnet account <ExternalLink size={14} />
            </a>

            <div className="telos-modal-actions">
              <Button variant="secondary" size="md" type="button" onClick={closeGenerateWalletModal}>
                Cancel
              </Button>
              <Button
                size="md"
                type="button"
                onClick={() => confirmGeneratedWallet(pair.publicKey, pair.secret)}
              >
                I’ve saved my secret — continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
