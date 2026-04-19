"use client";

import { BLOOM_COLORS, BLOOM_NAMES, pctColor } from "@/lib/constants";
import type { AlunoReport, Questao } from "@/lib/types";
import PctBadge from "@/components/PctBadge";

interface Props {
  relTurma: AlunoReport[];
  questoes: Questao[];
}

export default function TurmaTab({ relTurma, questoes }: Props) {
  if (relTurma.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-10">
        Sem dados de alunos para esta prova.
      </div>
    );
  }

  // Bloom distribution from questoes
  const bloomCounts: Record<number, number> = {};
  const areaCounts: Record<string, number> = {};
  for (const q of questoes) {
    bloomCounts[q.bloom_nivel] = (bloomCounts[q.bloom_nivel] ?? 0) + 1;
    areaCounts[q.area_display] = (areaCounts[q.area_display] ?? 0) + 1;
  }
  const total = questoes.length || 1;
  const maxArea = Math.max(...Object.values(areaCounts), 1);

  // Bloom aggregated performance
  const bloomAgg: Record<string, { ok: number; total: number }> = {};
  for (const rel of relTurma) {
    for (const [bn, stat] of Object.entries(rel.por_bloom)) {
      if (!bloomAgg[bn]) bloomAgg[bn] = { ok: 0, total: 0 };
      bloomAgg[bn].ok += stat.acertos;
      bloomAgg[bn].total += stat.total;
    }
  }
  const bloomAggEntries = Object.entries(bloomAgg);

  const ranking = [...relTurma].sort((a, b) => b.percentual - a.percentual);
  const medals = ["🥇","🥈","🥉"];

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloom dist */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição de Bloom na prova</h3>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(lvl => {
              const cnt = bloomCounts[lvl] ?? 0;
              const pct = Math.round(cnt * 100 / total);
              const c = BLOOM_COLORS[lvl];
              return (
                <div key={lvl} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 10 }}
                  className="p-2 text-center">
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: c }}>{cnt}</div>
                  <div className="text-xs font-semibold text-gray-700">{BLOOM_NAMES[lvl]}</div>
                  <div className="text-xs text-gray-400">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Area dist */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Área</h3>
          <div className="space-y-3">
            {Object.entries(areaCounts).sort((a,b) => b[1]-a[1]).map(([area, cnt]) => (
              <div key={area}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{area}</span>
                  <span className="text-gray-500">{cnt}q</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(cnt/maxArea)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bloom performance */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Desempenho médio por nível de Bloom</h3>
        {bloomAggEntries.length === 0 ? (
          <p className="text-sm text-gray-400">Sem dados suficientes.</p>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${bloomAggEntries.length}, 1fr)` }}>
            {bloomAggEntries.map(([bn, stat]) => {
              const pct = stat.total ? Math.round(stat.ok * 100 / stat.total) : 0;
              const c = pctColor(pct);
              return (
                <div key={bn} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 10 }}
                  className="p-4 text-center">
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: c }}>{pct}%</div>
                  <div className="text-sm font-semibold text-gray-700">{bn}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Ranking da turma</h3>
        <div className="space-y-2">
          {ranking.map((rel, i) => {
            const pct = rel.percentual;
            const c = pctColor(pct);
            return (
              <div key={rel.aluno.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center text-lg">{i < 3 ? medals[i] : `${i+1}.`}</span>
                  <span className="font-medium text-gray-900">{rel.aluno.nome}</span>
                  <span className="text-sm text-gray-400">{rel.acertos}/{rel.total}</span>
                </div>
                <PctBadge pct={pct} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
