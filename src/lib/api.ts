import type {
  Turma, Aluno, Prova, PipelineResult,
  AlunoReport, DrilldownData, Questao,
  TaxonomiaRelatorio, AlunoPontosCriticos,
  UsuarioAdmin, EscolaAgg, TaxonomiaNoFlat, TaxonomiaStats,
  ProvaAdmin,
} from "./types";
import { getToken, removeToken } from "./auth";

const BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.API_URL ?? "http://localhost:8000");

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Sessão expirada.");
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${path}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data: { nome: string; email: string; senha: string; escola: string }) =>
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

export const createTurma = (data: { nome: string; escola: string; disciplina?: string }) =>
  req<Turma>("/turmas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deleteTurma = (id: number) =>
  req<void>(`/turmas/${id}`, { method: "DELETE" });

// ── Alunos ────────────────────────────────────────────────────────────────────
export const getAlunos = (turmaId: number) =>
  req<Aluno[]>(`/turmas/${turmaId}/alunos`);

export const createAluno = (turmaId: number, nome: string) =>
  req<Aluno>(`/turmas/${turmaId}/alunos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });

// ── Provas ────────────────────────────────────────────────────────────────────
export const getProvas = (turmaId: number) =>
  req<Prova[]>(`/turmas/${turmaId}/provas`);

export const uploadProva = (formData: FormData) =>
  req<PipelineResult>("/provas/upload", { method: "POST", body: formData });

// ── Questoes + relatórios ─────────────────────────────────────────────────────
export const getQuestoes = (provaId: number) =>
  req<Questao[]>(`/provas/${provaId}/questoes`);

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

export const adminListEscolas = () =>
  req<EscolaAgg[]>("/admin/escolas");

export const adminListEtapas = () =>
  req<Array<{ etapa: string; total_nos: number; total_materias: number }>>("/admin/taxonomia/etapas");

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
