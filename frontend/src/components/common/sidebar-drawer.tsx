"use client";

import type { ReactNode } from "react";

type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  widthClassName?: string;
  children: ReactNode;
};

export function SidebarDrawer({
  open,
  onClose,
  eyebrow,
  title,
  description,
  widthClassName = "sm:max-w-2xl",
  children,
}: SidebarDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close sidebar"
        className="overlay-scrim absolute inset-0"
        onClick={onClose}
        type="button"
      />

      <div className="absolute inset-y-0 right-0 flex w-full justify-end">
        <aside
          className={`page-surface relative flex h-full w-full max-w-full flex-col border-l border-[color:var(--line-strong)] shadow-[-24px_0_80px_rgba(15,23,42,0.18)] ${widthClassName}`}
        >
          <div className="border-b border-line/80 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-strong/70">{eyebrow}</p> : null}
                <h2 className="mt-2 font-display text-xl text-brand-strong sm:text-2xl">{title}</h2>
                {description ? <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">{description}</p> : null}
              </div>
              <button
                className="btn-secondary w-full rounded-full px-4 py-2 text-sm font-semibold sm:w-auto"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </aside>
      </div>
    </div>
  );
}
