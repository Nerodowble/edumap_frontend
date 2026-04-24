export const BLOOM_COLORS: Record<number, string> = {
  1: "#3B82F6",
  2: "#10B981",
  3: "#F59E0B",
  4: "#F97316",
  5: "#EF4444",
  6: "#8B5CF6",
  0: "#9CA3AF",
};

export const BLOOM_NAMES: Record<number, string> = {
  1: "Lembrar",
  2: "Compreender",
  3: "Aplicar",
  4: "Analisar",
  5: "Avaliar",
  6: "Criar",
  0: "—",
};

export const YEAR_OPTIONS = [
  "1º ano EF","2º ano EF","3º ano EF","4º ano EF","5º ano EF",
  "6º ano EF","7º ano EF","8º ano EF","9º ano EF",
  "1º ano EM","2º ano EM","3º ano EM",
];

export const SUBJECT_OPTIONS = [
  "Detectar automaticamente",
  "Matemática","Português","Ciências","História","Geografia",
  "Biologia","Física","Química","Inglês","Artes","Ed. Física",
  "Psicologia","Saúde Mental","SUS",
];

export const SUBJECT_TO_KEY: Record<string, string> = {
  "Matemática": "matematica",
  "Português": "portugues",
  "Ciências": "ciencias",
  "História": "historia",
  "Geografia": "geografia",
  "Biologia": "biologia",
  "Física": "fisica",
  "Química": "quimica",
  "Inglês": "ingles",
  "Artes": "artes",
  "Ed. Física": "ed_fisica",
  "Psicologia": "psicologia",
  "Saúde Mental": "saude_mental",
  "SUS": "sus",
};

export function pctColor(pct: number): string {
  if (pct >= 70) return "#059669";
  if (pct >= 50) return "#D97706";
  return "#DC2626";
}

export function pctIcon(pct: number): string {
  if (pct >= 70) return "🟢";
  if (pct >= 50) return "🟡";
  return "🔴";
}
