"use client";

import { useState } from "react";
import { BLOOM_COLORS, BLOOM_NAMES, pctColor } from "@/lib/constants";
import type { AlunoReport, DrilldownData, DetalheQuestao } from "@/lib/types";
import PctBadge from "@/components/PctBadge";

const SUGS: Record<string, string> = {
  Lembrar:     "Revisar o conteúdo teórico — flashcards, listas de resumo.",
  Compreender: "Trabalhar interpretação com leituras variadas e exemplos.",
  Aplicar:     "Praticar com exercícios contextualizados do cotidiano.",
  Analisar:    "Propor atividades de comparação e debate estruturado.",
  Avaliar:     "Estimular argumentação escrita com critérios explícitos.",
  Criar:       "Criar projetos, produções originais ou resolução aberta.",
};

interface Props {
  relTurma: AlunoReport[];
  drilldown: DrilldownData;
}

export default function AlunoTab({ relTurma, drilldown }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  if (relTurma.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-10">
        Nenhum aluno com respostas registradas.
      </div>
    );
  }

  const ranking = [...relTurma].sort((a, b) => b.percentual - a.percentual);

  return (
    <div className="space-y-2">
      {ranking.map((rel, idx) => {
        const nome = rel.aluno.nome;
        const pct = rel.percentual;
        const isOpen = open === rel.aluno.id;
        const bloomEntries = Object.entries(rel.por_bloom);
        const medals = ["🥇","🥈","🥉"];

        return (
          <div key={rel.aluno.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setOpen(isOpen ? null : rel.aluno.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{idx < 3 ? medals[idx] : `${idx+1}.`}</span>
                <span className="font-semibold text-gray-900">{nome}</span>
                <span className="text-sm text-gray-400">{rel.acertos}/{rel.total} acertos</span>
              </div>
              <div className="flex items-center gap-2">
                <PctBadge pct={pct} />
                <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                {/* Bloom breakdown */}
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Por nível cognitivo</p>
                <div className={`grid gap-3 mb-5`} style={{ gridTemplateColumns: `repeat(${bloomEntries.length || 1}, 1fr)` }}>
                  {bloomEntries.map(([bn, stat]) => {
                    const p = stat.total ? Math.round(stat.acertos * 100 / stat.total) : 0;
                    const c = pctColor(p);
                    return (
                      <div key={bn} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 10 }}
                        className="p-3 text-center">
                        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: c }}>{p}%</div>
                        <div className="text-xs font-semibold text-gray-700">{bn}</div>
                        <div className="text-xs text-gray-400">{stat.acertos}/{stat.total}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Pontos críticos */}
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pontos críticos por conteúdo</p>
                {(() => {
                  const points: React.ReactNode[] = [];
                  for (const [area, subareas] of Object.entries(drilldown)) {
                    for (const [, subData] of Object.entries(subareas)) {
                      for (const [lvlStr, bdata] of Object.entries(subData.bloom)) {
                        const lvl = Number(lvlStr);
                        const al = bdata.alunos.find(a => a.nome === nome);
                        if (al && al.pct < 60 && al.total > 0) {
                          const bColor = BLOOM_COLORS[lvl] ?? "#9CA3AF";
                          points.push(
                            <div key={`${area}-${subData.label}-${lvl}`}
                              className="flex items-center gap-2 text-sm py-2 px-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg mb-1">
                              🔴 <strong className="text-gray-900">{area}</strong>
                              <span className="text-gray-400">→ {subData.label} →</span>
                              <span style={{ color: bColor, fontWeight: 600 }}>{bdata.nome}</span>
                              <span className="text-gray-400 text-xs">({al.ok}/{al.total})</span>
                            </div>
                          );
                        }
                      }
                    }
                  }
                  return points.length > 0 ? points : (
                    <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                      ✅ Nenhum ponto crítico identificado nesta prova. Bom desempenho!
                    </p>
                  );
                })()}

                {/* Detalhamento questão a questão */}
                {rel.detalhes && rel.detalhes.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 uppercase mt-5 mb-2">
                      Detalhamento por questão
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[...rel.detalhes].sort((a, b) => a.numero - b.numero).map((d: DetalheQuestao) => {
                        const ok = Boolean(d.correta);
                        return (
                          <div
                            key={d.numero}
                            title={`${d.area_display} — ${d.bloom_nome}\nRespondeu: ${d.resposta || "—"} | Gabarito: ${d.gabarito || "—"}`}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 text-xs font-bold cursor-default select-none
                              ${ok
                                ? "bg-green-50 border-green-400 text-green-700"
                                : "bg-red-50 border-red-400 text-red-700"
                              }`}
                          >
                            <span className="text-base leading-none">{ok ? "✓" : "✗"}</span>
                            <span className="mt-0.5">Q{d.numero}</span>
                            <span className="font-normal text-gray-500">{d.resposta || "—"}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Lista das questões erradas */}
                    {rel.detalhes.some(d => !d.correta) && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Questões erradas
                        </p>
                        <div className="space-y-1 mb-4">
                          {rel.detalhes
                            .filter(d => !d.correta)
                            .sort((a, b) => a.numero - b.numero)
                            .map((d: DetalheQuestao) => (
                              <div
                                key={d.numero}
                                className="flex items-center gap-3 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                              >
                                <span className="font-bold text-red-700 w-8">Q{d.numero}</span>
                                <span className="text-gray-600 flex-1">{d.area_display} — <span className="text-purple-600">{d.bloom_nome}</span></span>
                                <span className="text-gray-400 text-xs">
                                  Respondeu: <strong className="text-red-600">{d.resposta || "—"}</strong>
                                  {" "}| Gabarito: <strong className="text-green-700">{d.gabarito || "—"}</strong>
                                </span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Recomendações */}
                {bloomEntries.some(([, s]) => s.total && s.acertos * 100 / s.total < 50) && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Recomendações</p>
                    {bloomEntries.map(([bn, stat]) => {
                      if (!stat.total || stat.acertos * 100 / stat.total >= 50) return null;
                      return (
                        <div key={bn} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2 text-sm">
                          <strong className="text-amber-800">{bn}:</strong>{" "}
                          <span className="text-amber-700">{SUGS[bn] ?? "Reforçar este nível."}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
