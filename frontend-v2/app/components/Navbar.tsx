import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import StarLogo from "~/components/StarLogo";
import Button from "~/components/ui/Button";
import { useTelosStore } from "~/store";
import { truncateAddress } from "~/lib/utils";

const NAV_LINKS = [
  { to: "/economy", label: "Economy" },
  { to: "/how-it-works", label: "Docs" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const location = useLocation();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0.4, 0.95]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { wallet, connectWallet, disconnectWallet, generateWallet } = useTelosStore();

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{}}
      >
        <motion.div
          className="absolute inset-0 border-b border-[rgba(255,255,255,0.06)]"
          style={{
            backgroundColor: `rgba(0,0,0,${bgOpacity.get()})`,
            backdropFilter: "blur(12px)",
          }}
        />
        <motion.div
          className="absolute inset-0 border-b border-[rgba(255,255,255,0.06)]"
          style={{ backgroundColor: `rgba(0,0,0,0.4)`, backdropFilter: "blur(12px)" }}
        />

        <div className="telos-nav-bar relative h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <StarLogo size={32} animate />
            <span
              className="font-ui font-700 text-[0.9375rem] uppercase tracking-[0.15em] text-[#e8e8f0] group-hover:text-white transition-colors"
            >
              TELOS
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative font-ui font-400 text-[0.9rem] transition-colors duration-200"
                style={{ color: isActive(link.to) ? "#ffffff" : "#9898b0" }}
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff6b00]"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Wallet + Mobile Menu */}
          <div className="flex items-center gap-3">
            {wallet.connected ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-[0.75rem] text-[#9898b0]">
                  <span className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse shrink-0" aria-hidden />
                  <span className="truncate max-w-[7.5rem]">{truncateAddress(wallet.address!)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void disconnectWallet()}
                  className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.12em] text-[#5c5c78] hover:text-[#ff3366] transition-colors bg-transparent border-0 cursor-pointer px-1 py-0.5"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={generateWallet}>
                  Generate
                </Button>
                <Button size="sm" onClick={() => void connectWallet()}>
                  Connect
                </Button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden text-[#9898b0] hover:text-[#e8e8f0] transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={menuOpen ? { opacity: 1, pointerEvents: "auto" } : { opacity: 0, pointerEvents: "none" }}
        className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8"
      >
        {NAV_LINKS.map((link, i) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, y: 20 }}
            animate={menuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={link.to}
              className="font-ui font-600 text-3xl transition-colors duration-200"
              style={{ color: isActive(link.to) ? "#ffba5c" : "#9898b0" }}
            >
              {link.label}
            </Link>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={menuOpen ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          {wallet.connected ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <div className="flex items-center gap-2 font-mono text-sm text-[#9898b0]">
                <span className="w-2 h-2 rounded-full bg-[#00ff94] shrink-0" aria-hidden />
                {truncateAddress(wallet.address!)}
              </div>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => void disconnectWallet()}>
                Disconnect wallet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button onClick={() => void connectWallet()} size="lg" className="w-full">
                Connect wallet
              </Button>
              <Button onClick={generateWallet} size="lg" variant="secondary" className="w-full">
                Generate wallet
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
