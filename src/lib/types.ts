export interface Turma {
  id: number;
  nome: string;
  escola: string;
  disciplina?: string;
  etapa?: string;  // slug: curso_logistica, ef2, superior...
  criado_em: string;
}

export interface MateriaInfo {
  materia: string;       // slug (ex: suprimentos_estoques)
  label: string;         // label legivel (ex: "Suprimentos e Gestão de Estoques")
  total_nos: number;
}

export interface TurmaContexto {
  etapa: string;
  etapa_label: string;
  etapa_grupo: string;
  materias: MateriaInfo[];
  tem_filtro: boolean;
}

export interface Aluno {
  id: number;
  nome: string;
  turma_id: number;
  ra?: string;
  cpf?: string;
  data_nascimento?: string;
  criado_em?: string;
}

export type ProvaStatus = "rascunho" | "publicada" | "encerrada";
export type ProvaOrigem = "ocr" | "manual";

export interface Prova {
  id: number;
  titulo: string;
  turma_id?: number;
  disciplina: string;
  serie: string;
  arquivo_nome: string;
  ocr_method: string;
  total_questoes: number;
  origem?: ProvaOrigem;
  status?: ProvaStatus;
  pin?: string;
  tempo_limite_min?: number | null;
  publicada_em?: string | null;
  encerrada_em?: string | null;
  criado_em: string;
}

// Questão de prova manual (com alternativas inline e gabarito visível para professor)
export interface QuestaoEdicao {
  id: number;
  prova_id: number;
  numero: number;
  stem: string;
  tipo: TipoQuestao;
  alternativas: string[];
  gabarito: string;
  bloom_nivel: number;
  bloom_nome: string;
  bloom_verbo?: string;
  taxonomia_codigo?: string;
  area_key?: string;
  area_display?: string;
  subarea_key?: string;
  subarea_label?: string;
}

export interface ProvaEdicaoResp {
  prova: Prova;
  questoes: QuestaoEdicao[];
}

// Monitor de aplicação ao vivo
export type AlunoAcessoStatus = "aguardando" | "em_andamento" | "finalizado" | "aguardando_relogin";

export interface AlunoAcesso {
  aluno_id: number;
  aluno_nome: string;
  ra?: string;
  started_at?: string | null;
  finished_at?: string | null;
  fingerprint?: string | null;
  liberado_em?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  status: AlunoAcessoStatus;
}

export interface MonitorProvaResp {
  prova: {
    id: number;
    titulo: string;
    status: ProvaStatus;
    pin?: string;
    publicada_em?: string | null;
    encerrada_em?: string | null;
    total_questoes: number;
  };
  acessos: AlunoAcesso[];
}

// Aluno (sessão pública)
export interface AlunoSessao {
  id: number;
  nome: string;
  ra: string;
  turma_id?: number;
}

export interface ProvaEmAberto {
  id: number;
  titulo: string;
  disciplina: string;
  serie: string;
  total_questoes: number;
  tempo_limite_min?: number | null;
  publicada_em: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface QuestaoParaAluno {
  id: number;
  numero: number;
  stem: string;
  alternativas: string[];
  tipo: TipoQuestao;
}

export interface ProvaAlunoResp {
  prova: {
    id: number;
    titulo: string;
    disciplina: string;
    total_questoes: number;
    tempo_limite_min?: number | null;
  };
  started_at: string;
  questoes: QuestaoParaAluno[];
}

export interface BnccSkill {
  codigo: string;
  descricao?: string;
}

export type TipoQuestao = "multipla_escolha" | "verdadeiro_falso";

export interface Question {
  number: number;
  text: string;
  stem: string;
  alternatives: string[];
  tipo?: TipoQuestao;
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
  tipo?: TipoQuestao;
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

export interface Convite {
  id: number;
  codigo: string;
  role: "professor" | "admin_escolar";
  escola: string | null;
  usos_max: number;
  usos: number;
  expira_em: string; // ISO-8601 UTC
  ativo: number;
  status: "ativo" | "expirado" | "esgotado" | "desativado";
  criado_por_nome?: string | null;
  criado_em: string;
}

export type ConviteValidacao =
  | { valido: true; role: "professor" | "admin_escolar"; escola: string }
  | { valido: false };

export interface EscolaAgg {
  escola: string;
  usuarios: number;
  turmas: number;
}

export interface ProvaAdmin extends Prova {
  turma_nome: string | null;
  turma_escola: string | null;
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
