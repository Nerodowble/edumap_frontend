import { BLOOM_COLORS, BLOOM_NAMES } from "@/lib/constants";

interface Props {
  level: number;
  verb?: string;
  showVerb?: boolean;
}

export default function BloomBadge({ level, verb, showVerb = false }: Props) {
  const color = BLOOM_COLORS[level] ?? BLOOM_COLORS[0];
  const name = BLOOM_NAMES[level] ?? "—";

  return (
    <div
      style={{
        background: `${color}22`,
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: "8px 12px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: ".7rem", color: "#6B7280", marginBottom: 2 }}>Bloom</div>
      <div style={{ fontWeight: 700, color }}>{name}</div>
      {showVerb && verb && (
        <div style={{ fontSize: ".7rem", color: "#9CA3AF", marginTop: 2 }}>
          verbo: {verb}
        </div>
      )}
    </div>
  );
}
