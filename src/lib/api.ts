import type {
  Turma, Aluno, Prova, PipelineResult,
  AlunoReport, DrilldownData, Questao,
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
