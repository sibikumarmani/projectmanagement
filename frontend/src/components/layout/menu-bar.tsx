"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type MenuBarProps = {
  items: MenuItem[];
};

export function MenuBar({ items }: MenuBarProps) {
  const pathname = usePathname();

  return (
    <nav className="relative z-20 border-b border-[#d6e7ec] bg-[linear-gradient(180deg,rgba(244,250,251,0.96),rgba(235,244,247,0.94))] backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[linear-gradient(135deg,#183247,#1b6d7f)] text-white shadow-[0_12px_24px_rgba(24,50,71,0.18)]"
                    : "bg-white/92 text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.05)] ring-1 ring-[#dbe7ea] hover:bg-white hover:text-[#138a9e]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
