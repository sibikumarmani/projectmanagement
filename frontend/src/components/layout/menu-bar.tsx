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
    <nav className="relative z-20 border-b backdrop-blur-xl" style={{ borderColor: "var(--menu-border)", background: "var(--menu-surface)" }}>
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
                    ? "text-[color:var(--on-brand)] shadow-[0_12px_24px_rgba(24,50,71,0.18)]"
                    : "ring-1 ring-[color:var(--line)] hover:text-brand"
                }`}
                style={
                  active
                    ? { background: "linear-gradient(135deg, var(--menu-active-start), var(--menu-active-end))" }
                    : {
                        background: "var(--menu-item-bg)",
                        color: "var(--menu-item-text)",
                        boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
                      }
                }
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
