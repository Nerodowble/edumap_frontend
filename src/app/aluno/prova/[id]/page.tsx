"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { alunoGetQuestoes, alunoResponder, alunoFinalizar } from "@/lib/api";
import { isAlunoAutenticado, getAlunoSessao } from "@/lib/alunoAuth";
import type { ProvaAlunoResp } from "@/lib/types";

export default function ResponderProvaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const provaId = Number(params.id);

  const [data, setData] = useState<ProvaAlunoResp | null>(null);
  const [respostas, setRespostas] = useState<Record<number, string>>({}); // questao_id -> letra
  const [idx, setIdx] = useState(0); // questão atual
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [confirmarFinal, setConfirmarFinal] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Tempo por questão: armazena o timestamp em que o aluno chegou na questão atual
  const questaoEnteredAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAlunoAutenticado()) {
      router.replace("/aluno");
      return;
    }
    alunoGetQuestoes(provaId)
      .then(d => {
        setData(d);
        // Tenta restaurar idx do localStorage se aluno saiu e voltou
        const lastIdx = localStorage.getItem(`edumap_prova_${provaId}_idx`);
        if (lastIdx) setIdx(Math.min(parseInt(lastIdx, 10), d.questoes.length - 1));
        const rawResp = localStorage.getItem(`edumap_prova_${provaId}_resp`);
        if (rawResp) {
          try { setRespostas(JSON.parse(rawResp)); } catch { /* ignore */ }
        }
        questaoEnteredAt.current = Date.now();
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro";
        if (msg.includes("403") || msg.includes("409")) {
          setErro("Não foi possível abrir esta prova. Volte para a lista e tente novamente.");
        } else {
          setErro(msg);
        }
      });
  }, [provaId, router]);

  // Persiste estado local pra não perder em F5
  useEffect(() => {
    if (data) {
      localStorage.setItem(`edumap_prova_${provaId}_idx`, String(idx));
      localStorage.setItem(`edumap_prova_${provaId}_resp`, JSON.stringify(respostas));
    }
  }, [idx, respostas, provaId, data]);

  // Timer global da prova
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!data) return;
    const start = new Date(data.started_at).getTime();
    const i = setInterval(() => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(i);
  }, [data]);

  const total = data?.questoes.length || 0;
  const questaoAtual = useMemo(() => data?.questoes[idx], [data, idx]);
  const respondidas = Object.keys(respostas).length;
  const todasRespondidas = total > 0 && respondidas >= total;

  async function escolher(letra: string) {
    if (!questaoAtual || salvando) return;
    setSalvando(true);
    const tempo = Math.max(1, Math.round((Date.now() - questaoEnteredAt.current) / 1000));
    try {
      await alunoResponder(provaId, {
        questao_id: questaoAtual.id,
        resposta: letra,
        tempo_segundos: tempo,
      });
      setRespostas(r => ({ ...r, [questaoAtual.id]: letra }));
      // Auto-avança se não for a última
      if (idx < total - 1) {
        setIdx(idx + 1);
        questaoEnteredAt.current = Date.now();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  function irPara(novoIdx: number) {
    if (novoIdx < 0 || novoIdx >= total) return;
    setIdx(novoIdx);
    questaoEnteredAt.current = Date.now();
  }

  async function handleFinalizar() {
    setFinalizando(true);
    try {
      await alunoFinalizar(provaId);
      localStorage.removeItem(`edumap_prova_${provaId}_idx`);
      localStorage.removeItem(`edumap_prova_${provaId}_resp`);
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao finalizar.");
      setFinalizando(false);
    }
  }

  if (erro && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 text-center">
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

  const minutos = Math.floor(elapsedSec / 60);
  const segundos = elapsedSec % 60;
  const tempoStr = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Top bar com progresso e timer */}
      <header className="bg-white border-b border-gray-200 px-3 py-2 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 truncate">{data.prova.titulo}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all"
                  style={{ width: `${(respondidas / total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 tabular-nums">{respondidas}/{total}</span>
            </div>
          </div>
          <div className="text-sm font-mono text-gray-700 tabular-nums">{tempoStr}</div>
        </div>
      </header>

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
                const sel = respostas[questaoAtual.id] === letra;
                return (
                  <button
                    key={letra}
                    onClick={() => escolher(letra)}
                    disabled={salvando}
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
                const sel = respostas[questaoAtual.id] === letra;
                return (
                  <button
                    key={letra}
                    onClick={() => escolher(letra)}
                    disabled={salvando}
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
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
              const respondida = !!respostas[q.id];
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
            {todasRespondidas ? "Tudo respondido ✓" : `${total - respondidas} sem resposta`}
          </span>
          <button
            onClick={() => setConfirmarFinal(true)}
            className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm"
          >
            Finalizar
          </button>
        </div>
      </div>

      {/* Modal de confirmação */}
      {confirmarFinal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-in">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Finalizar prova?</h3>
            <p className="text-sm text-gray-600 mb-1">
              Você respondeu <strong>{respondidas} de {total}</strong> questões.
            </p>
            {!todasRespondidas && (
              <p className="text-sm text-amber-700 mb-3">
                ⚠ Você ainda tem questões em branco. Tem certeza que quer enviar?
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
                onClick={handleFinalizar}
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
