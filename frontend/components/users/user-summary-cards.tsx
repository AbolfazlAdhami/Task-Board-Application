import { Check, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

export function UserSummaryCards({
  total,
  active,
  owners,
}: {
  total: number;
  active: number;
  owners: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard
        icon={<UsersRound aria-hidden="true" size={18} />}
        label="همهٔ کاربران"
        value={total}
        tone="primary"
      />
      <SummaryCard
        icon={<Check aria-hidden="true" size={18} />}
        label="حساب‌های فعال"
        value={active}
        tone="success"
      />
      <SummaryCard
        icon={<ShieldCheck aria-hidden="true" size={18} />}
        label="مالک‌ها"
        value={owners}
        tone="violet"
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "primary" | "success" | "violet";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-xs text-muted">{label}</span>
        <span className="mt-0.5 block text-xl font-bold leading-none text-foreground">
          {value.toLocaleString("fa-IR")}
        </span>
      </span>
    </div>
  );
}
