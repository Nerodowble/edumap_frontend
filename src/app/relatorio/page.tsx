"use client";

import { useState, useEffect } from "react";
import { getTurmas, getProvas, getQuestoes, getRelatorioTurma, getRelatorioDrilldown } from "@/lib/api";
import type { Turma, Prova, AlunoReport, DrilldownData, Questao } from "@/lib/types";
import { pctColor } from "@/lib/constants";
import DrilldownTab from "./DrilldownTab";
import AlunoTab from "./AlunoTab";
import TurmaTab from "./TurmaTab";
import FlowBanner from "@/components/FlowBanner";
import InfoBox from "@/components/InfoBox";

type Tab = "drilldown" | "aluno" | "turma";

export default function RelatorioPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [provaId, setProvaId] = useState<number | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [relTurma, setRelTurma] = useState<AlunoReport[]>([]);
  const [drilldown, setDrilldown] = useState<DrilldownData>({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("drilldown");

  useEffect(() => {
    getTurmas().then(ts => {
      setTurmas(ts);
      if (ts.length > 0) setTurmaId(ts[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    setProvas([]);
    setProvaId(null);
    getProvas(turmaId).then(ps => {
      setProvas(ps);
      if (ps.length > 0) setProvaId(ps[0].id);
    }).catch(() => {});
  }, [turmaId]);

  useEffect(() => {
    if (!provaId) return;
    setLoading(true);
    Promise.all([
      getQuestoes(provaId).catch(() => [] as Questao[]),
      getRelatorioTurma(provaId).catch(() => [] as AlunoReport[]),
      getRelatorioDrilldown(provaId).catch(() => ({} as DrilldownData)),
    ]).then(([q, r, d]) => {
      setQuestoes(q);
      setRelTurma(r);
      setDrilldown(d);
    }).finally(() => setLoading(false));
  }, [provaId]);

  const turma = turmas.find(t => t.id === turmaId);
  const prova = provas.find(p => p.id === provaId);
  const media = relTurma.length
    ? Math.round(relTurma.reduce((s, r) => s + r.percentual, 0) / relTurma.length)
    : null;

  if (turmas.length === 0) {
    return (
      <div>
        <FlowBanner step={4} />
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Relatório do Professor</h1>
        <div className="card text-center py-12 text-gray-500">
          Nenhuma turma cadastrada. Vá em{" "}
          <a href="/turmas" className="text-blue-600 underline">Turmas e Alunos</a>{" "}
          para começar.
        </div>
      </div>
    );
  }

  return (
    <div>
      <FlowBanner step={4} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">📊 Relatório do Professor</h1>
      <p className="text-gray-500 mb-5">Diagnóstico detalhado do desempenho da turma por área e nível cognitivo.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InfoBox variant="info" title="Como ler este relatório?">
          <ul className="space-y-1 text-xs">
            <li>• <strong>Drill-Down:</strong> desempenho por área → subárea → nível de Bloom → aluno.</li>
            <li>• <strong>Por Aluno:</strong> ranking individual com pontos críticos de cada estudante.</li>
            <li>• <strong>Visão da Turma:</strong> média geral e os alunos que mais precisam de atenção.</li>
          </ul>
        </InfoBox>
        <InfoBox variant="tip" title="Como interpretar os percentuais?">
          <ul className="space-y-1 text-xs">
            <li><span className="font-bold text-green-700">≥ 70%</span> — desempenho satisfatório.</li>
            <li><span className="font-bold text-amber-700">50 – 69%</span> — atenção: reforço recomendado.</li>
            <li><span className="font-bold text-red-700">&lt; 50%</span> — dificuldade significativa: priorizar este conteúdo.</li>
          </ul>
        </InfoBox>
        <InfoBox variant="glossary" title="Níveis de Bloom (cognitivo)">
          <div className="space-y-0.5 text-xs">
            {[
              [1,"Lembrar","memorizar fatos"],
              [2,"Compreender","explicar com as próprias palavras"],
              [3,"Aplicar","usar em situações práticas"],
              [4,"Analisar","comparar e decompor"],
              [5,"Avaliar","julgar e argumentar"],
              [6,"Criar","elaborar algo original"],
            ].map(([n, name, desc]) => (
              <div key={n} className="flex gap-1.5 items-baseline">
                <span className="font-bold text-gray-600 w-3">{n}.</span>
                <span><strong>{name}</strong> <span className="text-gray-400">— {desc}</span></span>
              </div>
            ))}
          </div>
        </InfoBox>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="label">Turma</label>
          <select className="input" value={turmaId ?? ""} onChange={e => setTurmaId(Number(e.target.value))}>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome} — {t.escola}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Prova</label>
          {provas.length === 0 ? (
            <p className="text-sm text-gray-400 mt-2">Esta turma não tem provas analisadas.</p>
          ) : (
            <select className="input" value={provaId ?? ""} onChange={e => setProvaId(Number(e.target.value))}>
              {provas.map(p => (
                <option key={p.id} value={p.id}>{p.titulo} — {p.criado_em.slice(0, 10)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <span className="animate-spin inline-block mr-2">⏳</span> Carregando relatório…
        </div>
      )}

      {!loading && prova && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{prova.total_questoes}</div>
              <div className="text-xs text-gray-500 mt-1">Questões</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{prova.serie}</div>
              <div className="text-xs text-gray-500 mt-1">Série</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{relTurma.length}</div>
              <div className="text-xs text-gray-500 mt-1">Alunos avaliados</div>
            </div>
            <div className="card text-center">
              {media !== null ? (
                <>
                  <div className="text-2xl font-bold" style={{ color: pctColor(media) }}>{media}%</div>
                  <div className="text-xs text-gray-500 mt-1">Média da turma</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-300">—</div>
                  <div className="text-xs text-gray-500 mt-1">Média da turma</div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-2 flex-wrap">
            {([
              ["drilldown", "🔍 Diagnóstico por Conteúdo"],
              ["aluno",     "👤 Por Aluno"],
              ["turma",     "🏫 Visão Geral"],
            ] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`tab-btn ${tab === t ? "tab-btn-active" : "tab-btn-inactive"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-5">
            {{
              drilldown: "Mostra onde a turma tem dificuldades: área → subárea → nível cognitivo → aluno.",
              aluno:     "Lista cada aluno com seus acertos totais e os pontos que mais precisa reforçar.",
              turma:     "Visão consolidada da turma com distribuição de desempenho e alunos em atenção.",
            }[tab]}
          </p>

          {tab === "drilldown" && (
            <DrilldownTab
              drilldown={drilldown}
              turmaNome={turma?.nome ?? ""}
              provaTitle={prova.titulo}
            />
          )}
          {tab === "aluno" && <AlunoTab relTurma={relTurma} drilldown={drilldown} />}
          {tab === "turma" && <TurmaTab relTurma={relTurma} questoes={questoes} />}
        </>
      )}
    </div>
  );
}
