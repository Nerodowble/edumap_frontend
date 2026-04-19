"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getTurmas, getAlunos, getProvas, getQuestoes,
  getGabarito, lancarRespostas, ocrGabaritoAluno,
} from "@/lib/api";
import type { Turma, Aluno, Prova, Questao } from "@/lib/types";
import FlowBanner from "@/components/FlowBanner";
import InfoBox from "@/components/InfoBox";

export default function LancarPage() {
  const [turmas, setTurmas]     = useState<Turma[]>([]);
  const [turmaId, setTurmaId]   = useState<number | null>(null);
  const [alunos, setAlunos]     = useState<Aluno[]>([]);
  const [provas, setProvas]     = useState<Prova[]>([]);
  const [provaId, setProvaId]   = useState<number | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [gabarito, setGabarito] = useState<Record<string, string>>({});
  // respostas[alunoId][numeroQuestao] = alternativa
  const [respostas, setRespostas] = useState<Record<number, Record<number, string>>>({});
  // células preenchidas via OCR (para highlight visual)
  const [ocrCells, setOcrCells] = useState<Record<string, boolean>>({});
  // qual aluno está com OCR em andamento
  const [ocrLoadingId, setOcrLoadingId] = useState<number | null>(null);
  // resultado OCR para mostrar feedback
  const [ocrFeedback, setOcrFeedback] = useState<Record<number, string>>({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  // Input file oculto por aluno
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrAlunoRef  = useRef<number | null>(null);

  // Grade: index = alunoIdx * questoes.length + qIdx
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { getTurmas().then(setTurmas).catch(() => {}); }, []);

  async function handleTurmaChange(id: number) {
    setTurmaId(id);
    setProvaId(null);
    setQuestoes([]);
    setGabarito({});
    setRespostas({});
    setOcrCells({});
    setOcrFeedback({});
    setSaved(false);
    const [al, pr] = await Promise.all([getAlunos(id), getProvas(id)]);
    setAlunos(al);
    setProvas(pr);
  }

  async function handleProvaChange(id: number) {
    setProvaId(id);
    setRespostas({});
    setOcrCells({});
    setOcrFeedback({});
    setSaved(false);
    const [qs, gab] = await Promise.all([getQuestoes(id), getGabarito(id)]);
    setQuestoes(qs);
    setGabarito(gab as Record<string, string>);
  }

  const setResposta = useCallback((alunoId: number, numero: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-E]/g, "").slice(-1);
    setSaved(false);
    setRespostas(prev => ({
      ...prev,
      [alunoId]: { ...(prev[alunoId] ?? {}), [numero]: upper },
    }));
    return upper;
  }, []);

  function handleCellChange(
    alunoIdx: number, qIdx: number,
    alunoId: number, numero: number, value: string,
  ) {
    const upper = setResposta(alunoId, numero, value);
    // remover highlight OCR se o professor editar a célula
    const key = `${alunoId}-${numero}`;
    setOcrCells(prev => { const n = { ...prev }; delete n[key]; return n; });
    if (upper && qIdx < questoes.length - 1) {
      const next = inputRefs.current[alunoIdx * questoes.length + qIdx + 1];
      next?.focus(); next?.select();
    }
  }

  // Abre o file picker para o aluno clicado
  function handleOcrClick(alunoId: number) {
    ocrAlunoRef.current = alunoId;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const alunoId = ocrAlunoRef.current;
    if (!file || !alunoId || !provaId) return;
    e.target.value = ""; // reset para permitir re-selecionar o mesmo arquivo

    setOcrLoadingId(alunoId);
    setOcrFeedback(prev => ({ ...prev, [alunoId]: "" }));
    try {
      const result = await ocrGabaritoAluno(provaId, file);
      const detected = result.respostas;
      const count = result.total_detectado;

      // Preencher as células detectadas
      const newOcrCells: Record<string, boolean> = { ...ocrCells };
      setRespostas(prev => {
        const alunoResps = { ...(prev[alunoId] ?? {}) };
        for (const [numStr, alt] of Object.entries(detected)) {
          const num = Number(numStr);
          alunoResps[num] = alt;
          newOcrCells[`${alunoId}-${num}`] = true;
        }
        return { ...prev, [alunoId]: alunoResps };
      });
      setOcrCells(newOcrCells);
      setSaved(false);

      const msg = count === 0
        ? "⚠️ Nenhuma resposta detectada — verifique a foto"
        : `✓ ${count} resposta${count !== 1 ? "s" : ""} detectada${count !== 1 ? "s" : ""} via OCR`;
      setOcrFeedback(prev => ({ ...prev, [alunoId]: msg }));
    } catch {
      setOcrFeedback(prev => ({ ...prev, [alunoId]: "⚠️ Erro no OCR — tente novamente" }));
    } finally {
      setOcrLoadingId(null);
    }
  }

  async function handleSave() {
    if (!provaId) return;
    setSaving(true); setError("");
    try {
      const payload: Record<string, Record<string, string>> = {};
      for (const [alunoId, resps] of Object.entries(respostas)) {
        const nonEmpty = Object.fromEntries(
          Object.entries(resps).filter(([, v]) => v !== "")
        );
        if (Object.keys(nonEmpty).length > 0) payload[alunoId] = nonEmpty;
      }
      await lancarRespostas(provaId, payload);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const temGabarito  = Object.keys(gabarito).length > 0;
  const semGabarito  = questoes.length > 0 && !temGabarito;
  const totalPreench = Object.values(respostas).reduce(
    (acc, r) => acc + Object.values(r).filter(Boolean).length, 0
  );
  const totalCelulas = alunos.length * questoes.length;

  return (
    <div>
      {/* Input file oculto compartilhado */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      <FlowBanner step={3} />

      <h1 className="text-2xl font-bold text-gray-900 mb-1">📝 Lançamento de Respostas</h1>
      <p className="text-gray-500 mb-5">
        Registre o que cada aluno respondeu — o sistema calcula acertos e erros automaticamente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoBox variant="info" title="Como funciona o lançamento?">
          <ol className="space-y-1">
            <li><strong>1.</strong> Selecione a turma e a prova desejada.</li>
            <li><strong>2.</strong> A grade exibe todos os alunos × questões.</li>
            <li><strong>3.</strong> Preencha as respostas (A, B, C, D ou E) — digitando ou via foto.</li>
            <li><strong>4.</strong> Clique em <strong>Salvar Respostas</strong> — o sistema compara com o gabarito e calcula tudo.</li>
          </ol>
        </InfoBox>
        <InfoBox variant="tip" title="Dois modos de preenchimento">
          <ul className="space-y-1.5">
            <li>⌨️ <strong>Manual:</strong> clique em uma célula e digite a letra. O cursor avança automaticamente para a próxima questão.</li>
            <li>📷 <strong>OCR (foto):</strong> clique no ícone 📷 ao lado do aluno e faça upload da folha de resposta. O sistema lê e preenche a linha automaticamente.</li>
            <li>✏️ Após o OCR, você pode corrigir qualquer célula antes de salvar.</li>
          </ul>
        </InfoBox>
      </div>

      {/* Seletores */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Turma</label>
            <select
              className="input"
              value={turmaId ?? ""}
              onChange={e => e.target.value && handleTurmaChange(Number(e.target.value))}
            >
              <option value="">Selecione a turma…</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}{t.escola ? ` — ${t.escola}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prova</label>
            <select
              className="input"
              value={provaId ?? ""}
              onChange={e => e.target.value && handleProvaChange(Number(e.target.value))}
              disabled={!turmaId || provas.length === 0}
            >
              <option value="">{provas.length === 0 && turmaId ? "Nenhuma prova nesta turma" : "Selecione a prova…"}</option>
              {provas.map(p => (
                <option key={p.id} value={p.id}>{p.titulo} ({p.serie})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Aviso sem gabarito */}
      {semGabarito && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">
          ⚠️ Esta prova ainda não tem gabarito definido. Vá em <strong>Analisar Prova</strong> e preencha o gabarito primeiro.
        </div>
      )}

      {/* Legenda */}
      {questoes.length > 0 && (
        <div className="flex items-center gap-5 text-xs text-gray-500 mb-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-green-400 bg-green-50 inline-block" /> Correto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-red-300 bg-red-50 inline-block" /> Errado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-50 inline-block" /> Detectado via OCR
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">📷</span> Upload do gabarito do aluno
          </span>
        </div>
      )}

      {/* Grade */}
      {questoes.length > 0 && alunos.length > 0 && (
        <>
          <div className="card overflow-x-auto mb-4 p-0">
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold sticky left-0 bg-gray-50 min-w-[160px]">Aluno</th>
                  <th className="py-3 px-2 text-gray-500 font-medium w-10 text-center" title="Upload OCR">📷</th>
                  {questoes.map(q => (
                    <th key={q.numero} className="text-center py-3 px-1 text-gray-500 font-medium w-10">Q{q.numero}</th>
                  ))}
                </tr>

                {temGabarito && (
                  <tr className="border-b border-green-200 bg-green-50">
                    <td className="py-2 px-4 text-xs font-bold text-green-700 sticky left-0 bg-green-50">Gabarito</td>
                    <td />
                    {questoes.map(q => (
                      <td key={q.numero} className="text-center py-2 px-1 text-xs font-bold text-green-700">
                        {gabarito[String(q.numero)] ?? "—"}
                      </td>
                    ))}
                  </tr>
                )}
              </thead>

              <tbody>
                {alunos.map((aluno, alunoIdx) => {
                  const isOcring = ocrLoadingId === aluno.id;
                  const feedback = ocrFeedback[aluno.id];
                  const rowBg = alunoIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50";

                  return (
                    <>
                      <tr key={aluno.id} className={`border-b border-gray-100 ${rowBg}`}>
                        <td className={`py-2 px-4 font-medium text-gray-800 text-xs sticky left-0 ${rowBg}`}>
                          {aluno.nome}
                        </td>

                        {/* Botão OCR */}
                        <td className="px-2 text-center">
                          <button
                            onClick={() => handleOcrClick(aluno.id)}
                            disabled={isOcring || !provaId}
                            title="Upload do gabarito físico do aluno (imagem ou PDF)"
                            className={`w-8 h-8 rounded-lg border text-sm transition-colors
                              ${isOcring
                                ? "border-blue-300 bg-blue-50 text-blue-400 animate-pulse cursor-wait"
                                : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                              }`}
                          >
                            {isOcring ? "⏳" : "📷"}
                          </button>
                        </td>

                        {questoes.map((q, qIdx) => {
                          const val   = respostas[aluno.id]?.[q.numero] ?? "";
                          const gab   = gabarito[String(q.numero)];
                          const isOcr = ocrCells[`${aluno.id}-${q.numero}`];
                          const isCorrect = gab && val && val === gab;
                          const isWrong   = gab && val && val !== gab;
                          const refIdx    = alunoIdx * questoes.length + qIdx;

                          return (
                            <td key={q.numero} className="px-0.5 py-1.5 text-center">
                              <input
                                ref={el => { inputRefs.current[refIdx] = el; }}
                                type="text"
                                maxLength={1}
                                value={val}
                                onChange={e => handleCellChange(alunoIdx, qIdx, aluno.id, q.numero, e.target.value)}
                                onFocus={e => e.target.select()}
                                className={`w-8 h-8 text-center uppercase font-bold border-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm transition-colors
                                  ${isCorrect && isOcr ? "border-green-400 bg-green-50 text-green-700 ring-1 ring-blue-200" :
                                    isCorrect           ? "border-green-400 bg-green-50 text-green-700" :
                                    isWrong   && isOcr  ? "border-red-300 bg-red-50 text-red-600 ring-1 ring-blue-200" :
                                    isWrong             ? "border-red-300 bg-red-50 text-red-600" :
                                    isOcr               ? "border-blue-400 bg-blue-50 text-blue-700" :
                                                          "border-gray-200 bg-white text-gray-900"}`}
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Linha de feedback OCR */}
                      {feedback && (
                        <tr key={`feedback-${aluno.id}`} className={rowBg}>
                          <td colSpan={questoes.length + 2} className="px-4 pb-1.5 pt-0">
                            <span className={`text-xs ${feedback.startsWith("✓") ? "text-blue-600" : "text-amber-600"}`}>
                              {feedback}
                            </span>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-500">
              {totalPreench} / {totalCelulas} células preenchidas
              {totalCelulas > 0 && (
                <span className="ml-2 text-gray-400">({Math.round(totalPreench * 100 / totalCelulas)}%)</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {saved && <p className="text-green-600 text-sm font-medium">✓ Respostas salvas!</p>}
              <button
                onClick={handleSave}
                disabled={saving || semGabarito || totalPreench === 0}
                className="btn-primary px-8 py-2.5"
              >
                {saving ? "Salvando…" : "💾 Salvar Respostas"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Estado vazio */}
      {!turmaId && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-medium">Selecione uma turma e prova para começar</p>
          <p className="text-sm mt-1">Digite manualmente ou faça upload do gabarito físico de cada aluno</p>
        </div>
      )}
    </div>
  );
}
