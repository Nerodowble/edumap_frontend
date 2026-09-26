"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { alunoGetQuestoes, alunoFinalizar, errMsg, errStatus } from "@/lib/api";
import { isAlunoAutenticado, getAlunoSessao } from "@/lib/alunoAuth";
import { useFilaRespostas, chaveProvaAluno } from "@/lib/useFilaRespostas";
import type { ProvaAlunoResp } from "@/lib/types";

const AVISO_TEMPO_SEG = 5 * 60;

function formatarTempo(seg: number) {
  const s = Math.max(0, seg);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ResponderProvaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const provaId = Number(params.id);
  const alunoId = getAlunoSessao()?.id ?? 0;
  const chaveIdx = chaveProvaAluno(provaId, alunoId, "idx");

  const [data, setData] = useState<ProvaAlunoResp | null>(null);
  const [salvas, setSalvas] = useState<Record<string, string>>({}); // confirmadas pelo servidor
  const [idx, setIdx] = useState(0); // questão atual
  const [erro, setErro] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [confirmarFinal, setConfirmarFinal] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const onConfirmada = useCallback(
    (qid: string, resposta: string) => setSalvas(s => ({ ...s, [qid]: resposta })), [],
  );
  const onErroDefinitivo = useCallback((msg: string) => setErro(msg), []);
  const fila = useFilaRespostas(provaId, alunoId, onConfirmada, onErroDefinitivo);

  // Tempo por questão: timestamp em que o aluno chegou na questão atual
  const questaoEnteredAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAlunoAutenticado()) {
      router.replace("/aluno");
      return;
    }
    // Chaves antigas (sem id do aluno) vazavam respostas entre alunos no mesmo aparelho
    localStorage.removeItem(`edumap_prova_${provaId}_resp`);
    localStorage.removeItem(`edumap_prova_${provaId}_idx`);

    alunoGetQuestoes(provaId)
      .then(d => {
        setData(d);
        setSalvas(d.respostas ?? {});
        const lastIdx = localStorage.getItem(chaveIdx);
        if (lastIdx) setIdx(Math.min(parseInt(lastIdx, 10) || 0, d.questoes.length - 1));
        questaoEnteredAt.current = Date.now();
      })
      .catch(err => {
        const st = errStatus(err);
        setErro(st === 403 || st === 409
          ? "Não foi possível abrir esta prova. Volte para a lista e tente novamente."
          : errMsg(err, "Não foi possível carregar a prova. Verifique sua internet."));
      });
  }, [provaId, chaveIdx, router]);

  useEffect(() => {
    if (data) localStorage.setItem(chaveIdx, String(idx));
  }, [idx, data, chaveIdx]);

  // Resposta mostrada = pendente (mais recente) ou a já confirmada pelo servidor
  const respostas = useMemo(() => ({ ...salvas, ...fila.pendentes }), [salvas, fila.pendentes]);

  // Relógio: base vem do servidor (segundos_decorridos), sem depender do fuso do aparelho
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!data) return;
    const base = data.segundos_decorridos
      ?? Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000);
    const inicioLocal = Date.now() - (Number.isFinite(base) ? base : 0) * 1000;
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - inicioLocal) / 1000)));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [data]);

  const limiteSeg = data?.prova.tempo_limite_min ? data.prova.tempo_limite_min * 60 : null;
  const restanteSeg = limiteSeg !== null ? limiteSeg - elapsedSec : null;
  const tempoAcabou = restanteSeg !== null && restanteSeg <= 0;

  const total = data?.questoes.length || 0;
  const questaoAtual = useMemo(() => data?.questoes[idx], [data, idx]);
  const respondidas = data ? data.questoes.filter(q => respostas[String(q.id)]).length : 0;
  const todasRespondidas = total > 0 && respondidas >= total;

  function escolher(letra: string) {
    if (!questaoAtual || tempoAcabou) return;
    setErro("");
    const tempo = Math.max(1, Math.round((Date.now() - questaoEnteredAt.current) / 1000));
    fila.responder(questaoAtual.id, letra, tempo); // aparece marcada na hora; envio em segundo plano
    if (idx < total - 1) {
      setIdx(idx + 1);
      questaoEnteredAt.current = Date.now();
    }
  }

  function irPara(novoIdx: number) {
    if (novoIdx < 0 || novoIdx >= total) return;
    setIdx(novoIdx);
    questaoEnteredAt.current = Date.now();
  }

  const handleFinalizar = useCallback(async () => {
    setFinalizando(true);
    setErro("");
    const restantes = await fila.enviarPendentes();
    if (restantes > 0) {
      setErro(`Ainda há ${restantes} resposta(s) não enviada(s). Verifique a internet e tente de novo — nada foi perdido.`);
      setFinalizando(false);
      return;
    }
    try {
      await alunoFinalizar(provaId);
      fila.limpar();
      localStorage.removeItem(chaveIdx);
      setEnviado(true);
    } catch (err) {
      setErro(errMsg(err, "Não foi possível enviar a prova. Verifique a internet e tente de novo."));
      setFinalizando(false);
    }
  }, [fila, provaId, chaveIdx]);

  // Tempo esgotado: envia automaticamente (uma vez)
  const autoEnvioFeito = useRef(false);
  useEffect(() => {
    if (tempoAcabou && !enviado && !autoEnvioFeito.current) {
      autoEnvioFeito.current = true;
      setConfirmarFinal(false);
      void handleFinalizar();
    }
  }, [tempoAcabou, enviado, handleFinalizar]);

  if (erro && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 text-center" role="alert">
          <h2 className="text-lg font-bold text-red-700 mb-2">Ops!</h2>
          <p className="text-gray-700 text-sm mb-4">{erro}</p>
          <button onClick={() => router.push("/aluno/provas")} className="bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-800">
            Voltar para minhas provas
          </button>
        </div>
      </div>
    );
  }

  if (!data || !questaoAtual) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-500">Carregando…</div>;
  }

  if (enviado) {
    const sessao = getAlunoSessao();
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-3">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Prova enviada!</h2>
          <p className="text-gray-600 mb-1 text-sm">
            {sessao?.nome ? `Valeu, ${sessao.nome.split(" ")[0]}.` : "Tudo certo."}
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Suas respostas chegaram ao professor.
          </p>
          <button onClick={() => router.push("/aluno/provas")} className="bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-800">
            Voltar para minhas provas
          </button>
        </div>
      </div>
    );
  }

  const tempoCritico = restanteSeg !== null && restanteSeg <= AVISO_TEMPO_SEG;
  const respostaAtual = respostas[String(questaoAtual.id)];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Top bar com progresso e tempo */}
      <header className="bg-white border-b border-gray-200 px-3 py-2 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 truncate">{data.prova.titulo}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all"
                  style={{ width: `${total ? (respondidas / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 tabular-nums">{respondidas}/{total}</span>
            </div>
          </div>
          {restanteSeg !== null ? (
            <div
              className={`text-sm font-mono tabular-nums px-2 py-1 rounded ${tempoCritico ? "bg-red-100 text-red-800 font-bold" : "text-gray-700"}`}
              aria-live={tempoCritico ? "polite" : "off"}
              title="Tempo restante"
            >
              ⏱ {formatarTempo(restanteSeg)}
            </div>
          ) : (
            <div className="text-sm font-mono text-gray-700 tabular-nums" title="Tempo decorrido">{formatarTempo(elapsedSec)}</div>
          )}
        </div>
        {tempoCritico && !tempoAcabou && (
          <div className="max-w-2xl mx-auto mt-1 text-xs text-red-800 font-medium">
            Faltam menos de 5 minutos. Ao acabar o tempo, a prova será enviada automaticamente.
          </div>
        )}
      </header>

      {/* Situação do envio */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3" aria-live="polite">
        {fila.totalPendentes > 0 && fila.semConexao ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sem conexão. {fila.totalPendentes} resposta(s) guardada(s) neste aparelho — serão enviadas
            sozinhas quando a internet voltar. Pode continuar respondendo.
          </div>
        ) : fila.totalPendentes > 0 ? (
          <div className="text-xs text-gray-500">Salvando…</div>
        ) : respondidas > 0 ? (
          <div className="text-xs text-emerald-700">✓ Todas as respostas foram salvas</div>
        ) : null}
      </div>

      {/* Questão */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="text-sm text-blue-700 font-semibold mb-2">
            Questão {questaoAtual.numero} de {total}
          </div>
          <div className="text-gray-900 text-[15px] sm:text-base leading-relaxed mb-5 whitespace-pre-wrap">
            {questaoAtual.stem}
          </div>

          {questaoAtual.tipo === "verdadeiro_falso" ? (
            <div className="space-y-2">
              {["V", "F"].map(letra => {
                const sel = respostaAtual === letra;
                return (
                  <button
                    key={letra}
                    onClick={() => escolher(letra)}
                    disabled={tempoAcabou}
                    aria-pressed={sel}
                    className={`w-full flex items-center gap-3 text-left rounded-xl border-2 p-3 sm:p-4 transition-all ${
                      sel
                        ? "border-blue-700 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold ${
                      sel ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700"
                    }`}>
                      {letra}
                    </span>
                    <span className="font-medium text-gray-900">
                      {letra === "V" ? "Verdadeiro" : "Falso"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {questaoAtual.alternativas.map((alt, i) => {
                const letra = String.fromCharCode(65 + i); // A, B, C...
                const sel = respostaAtual === letra;
                return (
                  <button
                    key={letra}
                    onClick={() => escolher(letra)}
                    disabled={tempoAcabou}
                    aria-pressed={sel}
                    className={`w-full flex items-start gap-3 text-left rounded-xl border-2 p-3 sm:p-4 transition-all ${
                      sel
                        ? "border-blue-700 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full font-bold ${
                      sel ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700"
                    }`}>
                      {letra}
                    </span>
                    <span className="text-gray-900 leading-relaxed pt-1.5">{alt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {erro && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {erro}
            </div>
          )}
        </div>

        {/* Navegação entre questões */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => irPara(idx - 1)}
            disabled={idx === 0}
            className="flex-1 bg-white text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <button
            onClick={() => irPara(idx + 1)}
            disabled={idx >= total - 1}
            className="flex-1 bg-white text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>

        {/* Grid de questões (overview) */}
        <div className="mt-6">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Visão geral</div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
            {data.questoes.map((q, i) => {
              const respondida = !!respostas[String(q.id)];
              const atual = i === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => irPara(i)}
                  className={`aspect-square rounded-md text-sm font-semibold transition-all ${
                    atual
                      ? "ring-2 ring-blue-700 bg-blue-50 text-blue-700"
                      : respondida
                      ? "bg-blue-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-label={`Questão ${q.numero}${respondida ? ", respondida" : ""}`}
                >
                  {q.numero}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Barra inferior fixa: finalizar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {tempoAcabou
              ? "Tempo esgotado — enviando…"
              : todasRespondidas ? "Tudo respondido ✓" : `${total - respondidas} sem resposta`}
          </span>
          <button
            onClick={() => setConfirmarFinal(true)}
            disabled={finalizando}
            className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
          >
            {finalizando ? "Enviando…" : "Finalizar"}
          </button>
        </div>
      </div>

      {/* Modal de confirmação */}
      {confirmarFinal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="finalizar-titulo"
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-in"
          >
            <h3 id="finalizar-titulo" className="text-lg font-bold text-gray-900 mb-1">Finalizar prova?</h3>
            <p className="text-sm text-gray-600 mb-1">
              Você respondeu <strong>{respondidas} de {total}</strong> questões.
            </p>
            {!todasRespondidas && (
              <p className="text-sm text-amber-800 mb-3">
                ⚠ Você ainda tem questões em branco. Questões em branco contam como erro.
              </p>
            )}
            <p className="text-xs text-gray-500 mb-4">
              Depois de enviar, não dá pra mudar.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarFinal(false)}
                className="flex-1 bg-white text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Continuar prova
              </button>
              <button
                onClick={() => { setConfirmarFinal(false); void handleFinalizar(); }}
                disabled={finalizando}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
              >
                {finalizando ? "Enviando…" : "Enviar minhas respostas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
