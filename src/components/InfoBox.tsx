import type { ReactNode } from "react";

type Variant = "info" | "tip" | "glossary" | "warning";

const V: Record<Variant, { bg: string; border: string; fg: string; icon: string }> = {
  info:     { bg: "bg-blue-50",   border: "border-blue-200",   fg: "text-blue-900",   icon: "ℹ️" },
  tip:      { bg: "bg-amber-50",  border: "border-amber-200",  fg: "text-amber-900",  icon: "💡" },
  glossary: { bg: "bg-purple-50", border: "border-purple-200", fg: "text-purple-900", icon: "📖" },
  warning:  { bg: "bg-red-50",    border: "border-red-200",    fg: "text-red-900",    icon: "⚠️" },
};

export default function InfoBox({
  variant = "info",
  title,
  children,
  className = "",
}: {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const s = V[variant];
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-4 text-sm ${className}`}>
      {title && (
        <p className={`font-semibold ${s.fg} mb-2 flex items-center gap-2`}>
          <span aria-hidden>{s.icon}</span>
          {title}
        </p>
      )}
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}
