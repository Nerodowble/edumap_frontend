import { pctColor } from "@/lib/constants";

interface Props {
  pct: number;
  size?: "sm" | "md" | "lg";
}

export default function PctBadge({ pct, size = "md" }: Props) {
  const color = pctColor(pct);
  const padding = size === "sm" ? "2px 7px" : size === "lg" ? "4px 14px" : "2px 10px";
  const fontSize = size === "sm" ? ".78rem" : size === "lg" ? "1rem" : ".85rem";

  return (
    <span
      style={{
        background: color,
        color: "#fff",
        padding,
        borderRadius: 12,
        fontSize,
        fontWeight: 700,
        display: "inline-block",
      }}
    >
      {pct}%
    </span>
  );
}
