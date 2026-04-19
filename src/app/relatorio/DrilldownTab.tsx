"use client";

import { useState } from "react";
import { BLOOM_COLORS, pctColor, pctIcon } from "@/lib/constants";
import type { DrilldownData } from "@/lib/types";
import PctBadge from "@/components/PctBadge";

interface Props {
  drilldown: DrilldownData;
  turmaNome: string;
  provaTitle: string;
}

export default function DrilldownTab({ drilldown, turmaNome, provaTitle }: Props) {
  const areas = Object.keys(drilldown);
  const [openSub, setOpenSub] = useState<string | null>(null);

  if (areas.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-10">
        Nenhuma resposta registrada para esta prova ainda.
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        Diagnóstico para <strong>{turmaNome}</strong> — <em>{provaTitle}</em>
      </p>
      <p className="text-xs text-gray-400 mb-6">
        Clique em cada subárea para abrir o detalhamento. 🔴 = abaixo de 50% · 🟡 = 50–69% · 🟢 = 70%+
      </p>

      {areas.sort().map(area => {
        const subareas = drilldown[area];
        let aOk = 0, aTot = 0;
        Object.values(subareas).forEach(sub =>
          Object.values(sub.bloom).forEach(b =>
            b.alunos.forEach(al => { aOk += al.ok; aTot += al.total; })
          )
        );
        const aPct = aTot ? Math.round(aOk * 100 / aTot) : 0;
        const aColor = pctColor(aPct);

        return (
          <div key={area} className="mb-6">
            {/* Area header */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900">{area}</h3>
              <PctBadge pct={aPct} size="md" />
            </div>

            {/* Subareas */}
            <div className="space-y-2 pl-2">
              {Object.entries(subareas)
                .sort((a, b) => a[1].label.localeCompare(b[1].label))
                .map(([subKey, subData]) => {
                  let sOk = 0, sTot = 0;
                  Object.values(subData.bloom).forEach(b =>
                    b.alunos.forEach(al => { sOk += al.ok; sTot += al.total; })
                  );
                  const sPct = sTot ? Math.round(sOk * 100 / sTot) : 0;
                  const key = `${area}::${subKey}`;
                  const isOpen = openSub === key;

                  return (
                    <div key={subKey} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => setOpenSub(isOpen ? null : key)}
                      >
                        <span className="font-medium text-gray-800">
                          {pctIcon(sPct)} {subData.label}
                          <span className="text-gray-400 font-normal text-sm ml-2">
                            {sOk}/{sTot} acertos
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <PctBadge pct={sPct} size="sm" />
                          <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                          {Object.entries(subData.bloom).sort().map(([lvlStr, bdata]) => {
                            const lvl = Number(lvlStr);
                            const bColor = BLOOM_COLORS[lvl] ?? "#9CA3AF";
                            const comDificuldade = bdata.alunos.filter(a => a.pct < 60);
                            const dominam = bdata.alunos.filter(a => a.pct >= 70);

                            return (
                              <div key={lvl}>
                                {/* Bloom strip */}
                                <div
                                  style={{
                                    borderLeft: `4px solid ${bColor}`,
                                    background: `${bColor}11`,
                                    borderRadius: "0 8px 8px 0",
                                    padding: "8px 14px",
                                    marginBottom: 8,
                                  }}
                                >
                                  <span style={{ color: bColor, fontWeight: 700 }}>
                                    Bloom: {bdata.nome}
                                  </span>
                                  <span className="text-gray-500 text-sm ml-2">
                                    → média da turma:
                                  </span>
                                  <span className="ml-2">
                                    <PctBadge pct={bdata.pct_turma} size="sm" />
                                  </span>
                                </div>

                                {/* Com dificuldade */}
                                {comDificuldade.length > 0 && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                    <p className="text-xs font-semibold text-red-800 mb-1">
                                      🔴 Precisam de atenção — {subData.label} / {bdata.nome}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                      {comDificuldade.map(a => (
                                        <span key={a.nome} className="text-sm">
                                          <span className="font-semibold text-red-700">{a.nome}</span>
                                          <span className="text-gray-400 text-xs"> ({a.ok}/{a.total})</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Dominam */}
                                {dominam.length > 0 && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-800 mb-1">
                                      🟢 Dominam — {subData.label} / {bdata.nome}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                      {dominam.map(a => (
                                        <span key={a.nome} className="text-sm">
                                          <span className="font-semibold text-green-700">{a.nome}</span>
                                          <span className="text-gray-400 text-xs"> ({a.ok}/{a.total})</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <hr className="mt-4 border-gray-100" />
          </div>
        );
      })}
    </div>
  );
}
