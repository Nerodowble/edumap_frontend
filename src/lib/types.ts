export interface Turma {
  id: number;
  nome: string;
  escola: string;
  disciplina?: string;
  criado_em: string;
}

export interface Aluno {
  id: number;
  nome: string;
  turma_id: number;
  criado_em?: string;
}

export interface Prova {
  id: number;
  titulo: string;
  turma_id?: number;
  disciplina: string;
  serie: string;
  arquivo_nome: string;
  ocr_method: string;
  total_questoes: number;
  criado_em: string;
}

export interface BnccSkill {
  codigo: string;
  descricao?: string;
}

export interface Question {
  number: number;
  text: string;
  stem: string;
  alternatives: string[];
  area_key: string;
  area_display: string;
  area_confidence: number;
  subarea_key: string;
  subarea_label: string;
  bloom_level: number;
  bloom_name: string;
  bloom_verb?: string;
  bloom_color: string;
  bncc_skills: BnccSkill[];
}

export interface PipelineResult {
  prova_id: number;
  questions: Question[];
  ocr_method: string;
  file_name: string;
  year_level: string;
  subject: string;
  metadata: Record<string, string>;
}

export interface DetalheQuestao {
  numero: number;
  area_display: string;
  bloom_nivel: number;
  bloom_nome: string;
  correta: number;
  resposta: string;
  gabarito: string;
}

export interface AlunoReport {
  aluno: { id: number; nome: string };
  acertos: number;
  total: number;
  percentual: number;
  por_bloom: Record<string, { acertos: number; total: number }>;
  detalhes?: DetalheQuestao[];
}

export interface BloomData {
  nome: string;
  pct_turma: number;
  alunos: Array<{ nome: string; ok: number; total: number; pct: number }>;
}

export interface SubareaData {
  label: string;
  bloom: Record<number, BloomData>;
}

export type DrilldownData = Record<string, Record<string, SubareaData>>;

export interface Questao {
  id: number;
  prova_id: number;
  numero: number;
  texto: string;
  stem: string;
  area_key: string;
  area_display: string;
  subarea_key: string;
  subarea_label: string;
  bloom_nivel: number;
  bloom_nome: string;
  bloom_verbo?: string;
  taxonomia_codigo?: string;
  bncc_codigos: string;
}

export interface TaxonomiaNode {
  codigo: string;
  label: string;
  nivel: number;
  total: number;
  acertos: number;
  percentual: number;
  parent_codigo: string | null;
  filhos: TaxonomiaNode[];
}

export interface TaxonomiaRelatorio {
  arvore: TaxonomiaNode[];
}

export interface PontoCritico {
  codigo: string;
  label: string;
  total: number;
  acertos: number;
  percentual: number;
}

export interface AlunoPontosCriticos {
  aluno_id: number;
  nome: string;
  criticos: PontoCritico[];
}

export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  role: "admin_geral" | "admin_escolar" | "professor";
  escola: string | null;
  criado_em: string;
}

export interface EscolaAgg {
  escola: string;
  usuarios: number;
  turmas: number;
}

export interface TaxonomiaNoFlat {
  id: number;
  codigo: string;
  label: string;
  nivel: number;
  parent_id: number | null;
  palavras_chave: string;
  materia?: string;
}

export interface TaxonomiaStats {
  etapa: string;
  total_nos: number;
  por_materia: Array<{ materia: string; total: number }>;
  por_nivel: Array<{ nivel: number; total: number }>;
}
