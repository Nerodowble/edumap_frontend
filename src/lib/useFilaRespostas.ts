"use client";

// Fila de respostas da prova do aluno, resistente a queda de internet.
// Cada resposta é guardada no aparelho ANTES de ir ao servidor e só sai da fila
// quando o servidor confirma. Reenvio automático a cada 5s e quando a rede volta.
// A chave inclui o aluno: em computador compartilhado um aluno não vê o do outro.

import { useCallback, useEffect, useRef, useState } from "react";
import { alunoResponder, errStatus, errMsg } from "./api";

interface Pendente {
  resposta: string;
  tempo: number;
}

type Fila = Record<string, Pendente>; // questao_id -> resposta pendente

const INTERVALO_REENVIO_MS = 5000;

export function chaveProvaAluno(provaId: number, alunoId: number, sufixo: string) {
  return `edumap_prova_${provaId}_a${alunoId}_${sufixo}`;
}

function lerFila(chave: string): Fila {
  try {
    return JSON.parse(localStorage.getItem(chave) || "{}") as Fila;
  } catch {
    return {};
  }
}

export function useFilaRespostas(
  provaId: number,
  alunoId: number,
  onConfirmada: (questaoId: string, resposta: string) => void,
  onErroDefinitivo: (msg: string) => void,
) {
  const chave = chaveProvaAluno(provaId, alunoId, "fila");
  const [fila, setFila] = useState<Fila>({});
  const [semConexao, setSemConexao] = useState(false);
  const filaRef = useRef<Fila>({});

  const atualizar = useCallback((nova: Fila) => {
    filaRef.current = nova;
    setFila(nova);
    try { localStorage.setItem(chave, JSON.stringify(nova)); } catch { /* storage cheio */ }
  }, [chave]);

  useEffect(() => {
    const inicial = lerFila(chave);
    filaRef.current = inicial;
    setFila(inicial);
  }, [chave]);

  /** Tenta enviar tudo que está na fila. Retorna quantas continuam pendentes. */
  const remover = useCallback((qid: string) => {
    const { [qid]: _removida, ...resto } = filaRef.current; // eslint-disable-line @typescript-eslint/no-unused-vars
    atualizar(resto);
  }, [atualizar]);

  const rodada = useCallback(async (): Promise<void> => {
    const tentadas = new Map<string, string>(); // qid -> resposta já tentada nesta rodada
    // Repete enquanto surgirem respostas novas durante o envio (aluno respondendo rápido)
    for (;;) {
      const lote = Object.entries(filaRef.current).filter(([qid, p]) => tentadas.get(qid) !== p.resposta);
      if (lote.length === 0) return;
      for (const [qid, p] of lote) {
        tentadas.set(qid, p.resposta);
        try {
          await alunoResponder(provaId, { questao_id: Number(qid), resposta: p.resposta, tempo_segundos: p.tempo });
          setSemConexao(false);
          onConfirmada(qid, p.resposta);
          // Só remove se o aluno não trocou a resposta enquanto enviava
          if (filaRef.current[qid]?.resposta === p.resposta) remover(qid);
        } catch (err) {
          const st = errStatus(err);
          if (st === undefined || st === 0 || st >= 500) {
            setSemConexao(true); // rede/servidor: mantém na fila e tenta depois
            return;
          }
          // 4xx: o servidor recusou (ex.: tempo esgotado) — não adianta reenviar
          remover(qid);
          onErroDefinitivo(errMsg(err, "Não foi possível salvar uma resposta."));
        }
      }
    }
  }, [provaId, remover, onConfirmada, onErroDefinitivo]);

  const emAndamento = useRef<Promise<void> | null>(null);

  /** Tenta enviar tudo que está na fila. Retorna quantas continuam pendentes. */
  const enviarPendentes = useCallback(async (): Promise<number> => {
    // Se já há um envio rodando, espera ele e faz mais uma rodada (pega o que chegou depois)
    if (emAndamento.current) await emAndamento.current;
    const p = rodada().finally(() => { emAndamento.current = null; });
    emAndamento.current = p;
    await p;
    return Object.keys(filaRef.current).length;
  }, [rodada]);

  const responder = useCallback((questaoId: number, resposta: string, tempo: number) => {
    atualizar({ ...filaRef.current, [String(questaoId)]: { resposta, tempo } });
    void enviarPendentes();
  }, [atualizar, enviarPendentes]);

  // Reenvio periódico enquanto houver pendências + quando a rede volta
  const temPendentes = Object.keys(fila).length > 0;
  useEffect(() => {
    if (!temPendentes) return;
    const i = setInterval(() => { void enviarPendentes(); }, INTERVALO_REENVIO_MS);
    const online = () => { void enviarPendentes(); };
    window.addEventListener("online", online);
    return () => { clearInterval(i); window.removeEventListener("online", online); };
  }, [temPendentes, enviarPendentes]);

  const limpar = useCallback(() => {
    filaRef.current = {};
    setFila({});
    try { localStorage.removeItem(chave); } catch { /* ignore */ }
  }, [chave]);

  return {
    /** Respostas ainda não confirmadas pelo servidor: {questao_id: letra}. */
    pendentes: Object.fromEntries(Object.entries(fila).map(([k, v]) => [k, v.resposta])),
    totalPendentes: Object.keys(fila).length,
    semConexao,
    responder,
    enviarPendentes,
    limpar,
  };
}
