import type {
  Turma, Aluno, Prova, PipelineResult,
  AlunoReport, DrilldownData, Questao,
  TaxonomiaRelatorio, AlunoPontosCriticos,
  UsuarioAdmin, EscolaAgg, TaxonomiaNoFlat, TaxonomiaStats,
  ProvaAdmin, ProvaEdicaoResp, MonitorProvaResp,
  AlunoSessao, ProvaEmAberto, ProvaAlunoResp,
  TurmaContexto, Convite, ConviteValidacao,
} from "./types";
import { getToken, removeToken } from "./auth";
import { getAlunoToken, removeAlunoToken } from "./alunoAuth";

const BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.API_URL ?? "http://localhost:8000");

/** Erro de API com status HTTP e a mensagem `detail` do backend (se houver).
 *  `message` mantém o formato "[status] path: corpo" usado por telas antigas. */
export class ApiError extends Error {
  constructor(public status: number, public detail: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function toApiError(res: Response, path: string): Promise<ApiError> {
  const body = await res.text().catch(() => res.statusText);
  let detail = "";
  try {
    const d = JSON.parse(body)?.detail;
    if (typeof d === "string") detail = d;
  } catch { /* corpo não-JSON */ }
  return new ApiError(res.status, detail, `[${res.status}] ${path}: ${body}`);
}

/** Mensagem legível para o usuário: `detail` do backend ou o fallback. */
export function errMsg(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.detail) return e.detail;
  return fallback;
}

/** Status HTTP do erro (0 = sem conexão), ou undefined se não for ApiError. */
export function errStatus(e: unknown): number | undefined {
  return e instanceof ApiError ? e.status : undefined;
}

const MSG_SEM_CONEXAO = "Sem conexão com o servidor. Verifique sua internet e tente de novo.";

/** fetch que converte falha de rede ("Failed to fetch") em ApiError status 0. */
async function fetchApi(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError(0, MSG_SEM_CONEXAO, MSG_SEM_CONEXAO);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchApi(path, { ...init, headers });

  // 401 em /auth/* é credencial errada, não sessão expirada
  if (res.status === 401 && !path.startsWith("/auth/")) {
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Sessão expirada.", "Sessão expirada.");
  }
  if (!res.ok) throw await toApiError(res, path);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data: {
  nome: string; email: string; senha: string; escola: string; codigo_convite: string;
}) =>
  req<{ token: string; role: string; nome: string }>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const login = (data: { email: string; senha: string }) =>
  req<{ token: string; role: string; nome: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getMe = () =>
  req<{ id: number; nome: string; email: string; role: string; escola: string }>("/auth/me");

// ── Turmas ────────────────────────────────────────────────────────────────────
export const getTurmas = () => req<Turma[]>("/turmas");

export const createTurma = (data: { nome: string; escola: string; disciplina?: string; etapa?: string }) =>
  req<Turma>("/turmas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deleteTurma = (id: number) =>
  req<void>(`/turmas/${id}`, { method: "DELETE" });

export const updateTurma = (
  id: number,
  data: { nome: string; escola: string; disciplina?: string; etapa?: string | null },
) =>
  req<Turma>(`/turmas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getTurmaContexto = (id: number) =>
  req<TurmaContexto>(`/turmas/${id}/contexto`);

// Lista publica de etapas (para professor escolher ao criar turma)
export interface EtapaPublica {
  etapa: string;
  total_nos: number;
  total_materias: number;
  etapa_label: string;
  etapa_grupo: string;
  etapa_ordem?: number;
}
export const listarEtapas = () => req<EtapaPublica[]>("/etapas");

// ── Alunos ────────────────────────────────────────────────────────────────────
export const getAlunos = (turmaId: number) =>
  req<Aluno[]>(`/turmas/${turmaId}/alunos`);

export const createAluno = (turmaId: number, nome: string) =>
  req<Aluno>(`/turmas/${turmaId}/alunos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });

export const updateAluno = (alunoId: number, nome: string) =>
  req<Aluno>(`/alunos/${alunoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });

export const deleteAluno = (alunoId: number) =>
  req<void>(`/alunos/${alunoId}`, { method: "DELETE" });

// ── Provas ────────────────────────────────────────────────────────────────────
export const getProvas = (turmaId: number) =>
  req<Prova[]>(`/turmas/${turmaId}/provas`);

export const uploadProva = (formData: FormData) =>
  req<PipelineResult>("/provas/upload", { method: "POST", body: formData });

// ── Questoes + relatórios ─────────────────────────────────────────────────────
export const getQuestoes = (provaId: number) =>
  req<Questao[]>(`/provas/${provaId}/questoes`);

export const updateTipoQuestao = (provaId: number, questaoId: number, tipo: "multipla_escolha" | "verdadeiro_falso") =>
  req<{ ok: boolean; tipo: string }>(`/provas/${provaId}/questoes/${questaoId}/tipo`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo }),
  });

export const getRelatorioTurma = (provaId: number) =>
  req<AlunoReport[]>(`/provas/${provaId}/relatorio/turma`);

export const getRelatorioDrilldown = (provaId: number) =>
  req<DrilldownData>(`/provas/${provaId}/relatorio/drilldown`);

export const getRelatorioTaxonomia = (provaId: number) =>
  req<TaxonomiaRelatorio>(`/provas/${provaId}/relatorio/taxonomia`);

export const getPontosCriticos = (provaId: number) =>
  req<AlunoPontosCriticos[]>(`/provas/${provaId}/relatorio/pontos-criticos`);

export async function downloadTaxonomiaExport(etapa: string) {
  const token = getToken();
  const res = await fetch(`${BASE}/admin/taxonomia/export?etapa=${encodeURIComponent(etapa)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`[${res.status}] falha ao exportar taxonomia`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taxonomia_${etapa}_export.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadTaxonomiaTemplate() {
  const token = getToken();
  const res = await fetch(`${BASE}/admin/taxonomia/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`[${res.status}] falha ao baixar template`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "taxonomia_template.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadRelatorioPdf(provaId: number, suggestedName = `relatorio_prova_${provaId}.pdf`) {
  const token = getToken();
  const res = await fetch(`${BASE}/provas/${provaId}/relatorio/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${msg}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminListUsuarios = () =>
  req<UsuarioAdmin[]>("/admin/usuarios");

export const adminUpdateUsuario = (
  id: number,
  data: { nome?: string; role?: string; escola?: string },
) =>
  req<UsuarioAdmin>(`/admin/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminDeleteUsuario = (id: number) =>
  req<void>(`/admin/usuarios/${id}`, { method: "DELETE" });

// ── Convites ──────────────────────────────────────────────────────────────────
export const validarConvite = (codigo: string) =>
  req<ConviteValidacao>(`/convites/${encodeURIComponent(codigo.trim())}`);

export const adminListConvites = () => req<Convite[]>("/admin/convites");

export const adminCriarConvite = (data: {
  role: "professor" | "admin_escolar"; escola: string; usos_max: number; validade_dias: number;
}) =>
  req<Convite>("/admin/convites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminDesativarConvite = (id: number) =>
  req<Convite>(`/admin/convites/${id}`, { method: "DELETE" });

export const adminListEscolas = () =>
  req<EscolaAgg[]>("/admin/escolas");

export const adminRenameEscola = (nomeAntigo: string, nomeNovo: string) =>
  req<{ ok: boolean; usuarios_atualizados: number; turmas_atualizadas: number }>(
    `/admin/escolas/${encodeURIComponent(nomeAntigo)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome_novo: nomeNovo }),
    },
  );

export const adminDeleteEscola = (nome: string) =>
  req<{ ok: boolean; usuarios_deletados: number; turmas_deletadas: number }>(
    `/admin/escolas/${encodeURIComponent(nome)}`,
    { method: "DELETE" },
  );

export interface EtapaInfo {
  etapa: string;
  total_nos: number;
  total_materias: number;
  etapa_label: string;
  etapa_grupo: string;
  etapa_ordem?: number;
}

export const adminListEtapas = () =>
  req<EtapaInfo[]>("/admin/taxonomia/etapas");

export const adminGetTaxonomiaStats = (etapa = "ef2") =>
  req<TaxonomiaStats>(`/admin/taxonomia/stats?etapa=${etapa}`);

export const adminGetTaxonomiaNos = (materia?: string, etapa = "ef2") => {
  const q = new URLSearchParams({ etapa });
  if (materia) q.set("materia", materia);
  return req<TaxonomiaNoFlat[]>(`/admin/taxonomia/nos?${q.toString()}`);
};

export const adminSeedTaxonomia = () =>
  req<{ ok: boolean; adicionados: number; atualizados: number; total_depois: number }>(
    "/admin/seed-taxonomia",
    { method: "POST" },
  );

export const adminImportTaxonomiaJson = (data: unknown) =>
  req<{ ok: boolean; etapa: string; adicionados: number; atualizados: number; total_depois: number }>(
    "/admin/taxonomia/import-json",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

export const adminAtualizarNo = (id: number, body: { label?: string; palavras_chave?: string[] }) =>
  req<TaxonomiaNoFlat & { ok: boolean }>(`/admin/taxonomia/no/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const adminCriarNo = (body: { parent_id: number; codigo_slug: string; label: string; palavras_chave: string[] }) =>
  req<TaxonomiaNoFlat>("/admin/taxonomia/no", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const adminDeletarNo = (id: number) =>
  fetch(`${BASE}/admin/taxonomia/no/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  }).then(r => {
    if (!r.ok) throw new Error(`[${r.status}] delete falhou`);
  });

export const adminListProvas = () =>
  req<ProvaAdmin[]>("/admin/provas");

export const adminDeleteProva = (id: number) =>
  fetch(`${BASE}/admin/provas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  }).then(r => {
    if (!r.ok) throw new Error(`[${r.status}] delete falhou`);
  });

export const saveRespostas = (
  provaId: number,
  alunoId: number,
  respostas: Record<number, { resposta: string; gabarito: string; correta: boolean }>,
) =>
  req<void>(`/provas/${provaId}/respostas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aluno_id: alunoId, respostas }),
  });

// ── Gabarito ──────────────────────────────────────────────────────────────────
export const getGabarito = (provaId: number) =>
  req<Record<string, string>>(`/provas/${provaId}/gabarito`);

export const saveGabarito = (provaId: number, gabarito: Record<number, string>) =>
  req<{ ok: boolean }>(`/provas/${provaId}/gabarito`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gabarito }),
  });

export const ocrGabaritoAluno = (provaId: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return req<{
    respostas: Record<number, string>;
    total_detectado: number;
    ocr_method: string;
    texto_bruto: string;
  }>(`/provas/${provaId}/ocr-aluno`, { method: "POST", body: fd });
};

export const lancarRespostas = (
  provaId: number,
  respostas: Record<string, Record<string, string>>,
) =>
  req<{ ok: boolean }>(`/provas/${provaId}/lancar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respostas }),
  });

// ── Alunos (extendido com RA, CPF, DN) ────────────────────────────────────────
export const createAlunoCompleto = (
  turmaId: number,
  data: { nome: string; ra: string; cpf?: string; data_nascimento?: string },
) =>
  req<Aluno>(`/turmas/${turmaId}/alunos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const updateAlunoCompleto = (
  alunoId: number,
  data: { nome: string; ra: string; cpf?: string; data_nascimento?: string },
) =>
  req<Aluno>(`/alunos/${alunoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

// ── Prova manual (professor) ──────────────────────────────────────────────────
export const criarProvaManual = (data: {
  titulo: string;
  turma_id?: number | null;
  disciplina?: string;
  serie?: string;
  tempo_limite_min?: number | null;
}) =>
  req<Prova>("/provas/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const atualizarProvaManual = (provaId: number, data: {
  titulo: string;
  turma_id?: number | null;
  disciplina?: string;
  serie?: string;
  tempo_limite_min?: number | null;
}) =>
  req<Prova>(`/provas/${provaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getProvaEdicao = (provaId: number) =>
  req<ProvaEdicaoResp>(`/provas/${provaId}/edicao`);

export const addQuestaoManual = (
  provaId: number,
  data: {
    stem: string;
    alternativas: string[];
    gabarito: string;
    tipo?: "multipla_escolha" | "verdadeiro_falso";
    bloom_nivel?: number;
    bloom_nome?: string;
    bloom_verbo?: string;
    taxonomia_codigo?: string;
  },
) =>
  req<{ id: number; numero: number }>(`/provas/${provaId}/questoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const updateQuestaoManual = (
  provaId: number,
  questaoId: number,
  data: {
    stem: string;
    alternativas: string[];
    gabarito: string;
    tipo?: "multipla_escolha" | "verdadeiro_falso";
    bloom_nivel?: number;
    bloom_nome?: string;
    bloom_verbo?: string;
    taxonomia_codigo?: string;
  },
) =>
  req<{ ok: boolean }>(`/provas/${provaId}/questoes/${questaoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deleteQuestao = (provaId: number, questaoId: number) =>
  req<void>(`/provas/${provaId}/questoes/${questaoId}`, { method: "DELETE" });

export const publicarProva = (provaId: number, tempoLimiteMin?: number | null) =>
  req<{ ok: boolean; pin: string; total_questoes: number }>(`/provas/${provaId}/publicar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempo_limite_min: tempoLimiteMin ?? null }),
  });

export const encerrarProva = (provaId: number) =>
  req<{ ok: boolean }>(`/provas/${provaId}/encerrar`, { method: "POST" });

export const getMonitorProva = (provaId: number) =>
  req<MonitorProvaResp>(`/provas/${provaId}/monitor`);

export const liberarReloginAluno = (provaId: number, alunoId: number) =>
  req<{ ok: boolean }>(`/provas/${provaId}/alunos/${alunoId}/liberar-relogin`, { method: "POST" });

// ── Aluno (público) ───────────────────────────────────────────────────────────
async function reqAluno<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAlunoToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchApi(path, { ...init, headers });

  // 401 em /aluno/auth é nome/R.A. errado — não é sessão expirada
  if (res.status === 401 && path !== "/aluno/auth") {
    removeAlunoToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/aluno") {
      window.location.href = "/aluno";
    }
    const msg = "Sua sessão expirou. Entre novamente com seu nome e R.A.";
    throw new ApiError(401, msg, msg);
  }
  if (!res.ok) throw await toApiError(res, path);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const alunoLogin = (data: { nome: string; ra: string }) =>
  reqAluno<{ token: string; aluno: AlunoSessao }>("/aluno/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const alunoMe = () => reqAluno<AlunoSessao>("/aluno/me");

export const alunoListarProvas = () =>
  reqAluno<ProvaEmAberto[]>("/aluno/provas");

export const alunoIniciarProva = (provaId: number, pin: string) =>
  reqAluno<{ ok: boolean }>(`/aluno/provas/${provaId}/iniciar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });

export const alunoGetQuestoes = (provaId: number) =>
  reqAluno<ProvaAlunoResp>(`/aluno/provas/${provaId}/questoes`);

export const alunoResponder = (
  provaId: number,
  data: { questao_id: number; resposta: string; tempo_segundos?: number },
) =>
  reqAluno<{ ok: boolean }>(`/aluno/provas/${provaId}/responder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const alunoFinalizar = (provaId: number) =>
  reqAluno<{ ok: boolean }>(`/aluno/provas/${provaId}/finalizar`, { method: "POST" });

// ── Admin: reclassificacao de taxonomia ──────────────────────────────────────
export interface ReclassificarPreview {
  total_questoes: number;
  total_provas: number;
  disciplinas_disponiveis: string[];
}

export interface ReclassificarMudanca {
  prova_id: number;
  prova_titulo: string;
  numero: number;
  antes: { taxonomia: string; bloom: number; area: string };
  depois: { taxonomia: string; bloom: number; area: string };
}

export interface ReclassificarResp {
  ok: boolean;
  atualizadas: number;
  mantidas: number;
  total_processadas: number;
  mudancas: ReclassificarMudanca[];
}

export const adminReclassificarPreview = (disciplina?: string) => {
  const q = disciplina ? `?disciplina=${encodeURIComponent(disciplina)}` : "";
  return req<ReclassificarPreview>(`/admin/taxonomia/reclassificar/preview${q}`);
};

export const adminReclassificar = (data: { disciplina?: string; prova_ids?: number[] } = {}) =>
  req<ReclassificarResp>("/admin/taxonomia/reclassificar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
