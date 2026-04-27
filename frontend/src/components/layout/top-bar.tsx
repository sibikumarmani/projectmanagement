"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

type TopBarProps = {
  appName: string;
  userName: string;
  userRole?: string;
  avatarLabel: string;
  onLogout: () => void;
};

export function TopBar({ appName, userName, userRole, avatarLabel, onLogout }: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="relative z-30 overflow-visible border-b border-white/20 bg-[linear-gradient(135deg,#14324a,#1e5168_52%,#1f8aa0)] text-white backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Application</p>
          <h1 className="display-font truncate text-2xl font-semibold text-white">{appName}</h1>
        </div>

        <div className="relative z-50" ref={menuRef}>
          <button
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-left shadow-[0_12px_24px_rgba(9,25,39,0.16)] backdrop-blur transition hover:border-white/25 hover:bg-white/14"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22b5c8,#127388)] text-sm font-bold text-white">
              {avatarLabel}
            </div>
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-white/70">{userRole ?? "Signed in user"}</p>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition ${isMenuOpen ? "rotate-180" : ""}`} />
          </button>

          <div
            className={`absolute right-0 top-[calc(100%+0.35rem)] z-50 w-56 rounded-2xl border border-slate-200/80 bg-white/96 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur transition ${
              isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
            }`}
          >
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-semibold text-[#183247]">{userName}</p>
              <p className="truncate text-xs text-slate-500">{userRole ?? "Signed in user"}</p>
            </div>
            <button
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#138a9e] transition hover:bg-[#eaf8fa]"
              onClick={onLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
