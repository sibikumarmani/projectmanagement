import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, eyebrow, action, children }: SectionCardProps) {
  return (
    <section className="panel rounded-[28px] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">{eyebrow}</p>
          ) : null}
          <h2 className="display-font text-xl font-semibold text-brand-strong">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
