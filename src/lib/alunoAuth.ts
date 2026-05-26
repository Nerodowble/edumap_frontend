// Token de sessão do ALUNO (separado do token do professor)
// Armazenado em localStorage com chave própria, expira em 8h server-side.

import type { AlunoSessao } from "./types";

const TOKEN_KEY = "edumap_aluno_token";
const SESSAO_KEY = "edumap_aluno_sessao";

export const getAlunoToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const setAlunoToken = (token: string) => {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
};

export const removeAlunoToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSAO_KEY);
};

export const getAlunoSessao = (): AlunoSessao | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSAO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AlunoSessao;
  } catch {
    return null;
  }
};

export const setAlunoSessao = (s: AlunoSessao) => {
  if (typeof window !== "undefined") localStorage.setItem(SESSAO_KEY, JSON.stringify(s));
};

export const isAlunoAutenticado = (): boolean => !!getAlunoToken();

export const logoutAluno = () => {
  removeAlunoToken();
  if (typeof window !== "undefined") window.location.href = "/aluno";
};
