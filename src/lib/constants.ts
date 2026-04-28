// Paleta consistente para níveis de Bloom — usada em todas as telas (Analisar, Relatório, Badges)
export const BLOOM_COLORS: Record<number, string> = {
  1: "#3B82F6", // Lembrar — azul
  2: "#10B981", // Compreender — verde
  3: "#F59E0B", // Aplicar — amarelo
  4: "#F97316", // Analisar — laranja
  5: "#EC4899", // Avaliar — rosa
  6: "#8B5CF6", // Criar — roxo
  0: "#9CA3AF",
};

// Versão clara/pastel para fundos (cards, badges)
export const BLOOM_COLORS_LIGHT: Record<number, string> = {
  1: "#DBEAFE", // azul claro
  2: "#D1FAE5", // verde claro
  3: "#FEF3C7", // amarelo claro
  4: "#FED7AA", // laranja claro
  5: "#FCE7F3", // rosa claro
  6: "#EDE9FE", // roxo claro
  0: "#F3F4F6",
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

export const YEAR_GROUPS: Array<{ label: string; options: string[] }> = [
  {
    label: "Ensino Fundamental",
    options: [
      "1º ano EF", "2º ano EF", "3º ano EF", "4º ano EF", "5º ano EF",
      "6º ano EF", "7º ano EF", "8º ano EF", "9º ano EF",
    ],
  },
  {
    label: "Ensino Médio",
    options: ["1º ano EM", "2º ano EM", "3º ano EM", "Técnico integrado"],
  },
  {
    label: "Graduação",
    options: [
      "1º semestre (Graduação)", "2º semestre (Graduação)",
      "3º semestre (Graduação)", "4º semestre (Graduação)",
      "5º semestre (Graduação)", "6º semestre (Graduação)",
      "7º semestre (Graduação)", "8º semestre (Graduação)",
      "9º semestre (Graduação)", "10º semestre (Graduação)",
      "Graduação (outro)",
    ],
  },
  {
    label: "Pós-graduação",
    options: ["Especialização", "Mestrado", "Doutorado"],
  },
  {
    label: "Outros",
    options: ["Curso livre", "Concurso", "Avaliação diagnóstica"],
  },
];

// Flat list, mantida para compatibilidade e inicialização
export const YEAR_OPTIONS: string[] = YEAR_GROUPS.flatMap(g => g.options);

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
