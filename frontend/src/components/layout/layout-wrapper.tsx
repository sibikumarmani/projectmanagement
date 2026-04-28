"use client";

import type { ReactNode } from "react";

type LayoutWrapperProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function LayoutWrapper({ title, subtitle, children }: LayoutWrapperProps) {
  void subtitle;

  return (
    <main className="mx-auto max-w-[1600px] p-0 pt-34 sm:pt-36 lg:pt-38">
      <section className="page-surface rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
        <div className="border-b border-line px-5 py-5 sm:px-6 sm:py-6">
          <h2 className="display-font text-2xl font-semibold text-brand-strong sm:text-3xl">{title}</h2>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </section>
    </main>
  );
}
