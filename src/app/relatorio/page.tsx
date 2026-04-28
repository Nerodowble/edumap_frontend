"use client";

import { useState, useEffect } from "react";
import {
  getTurmas, getProvas, getQuestoes, getAlunos,
  getRelatorioTurma, getRelatorioDrilldown,
  getRelatorioTaxonomia, getPontosCriticos,
  downloadRelatorioPdf,
} from "@/lib/api";
import type {
  Turma, Prova, AlunoReport, DrilldownData, Questao,
  TaxonomiaNode, AlunoPontosCriticos,
} from "@/lib/types";
import { pctColor } from "@/lib/constants";
import DrilldownTab from "./DrilldownTab";
import AlunoTab from "./AlunoTab";
import TurmaTab from "./TurmaTab";
import TaxonomiaTab from "./TaxonomiaTab";
import FlowBanner from "@/components/FlowBanner";
import InfoBox from "@/components/InfoBox";

type Tab = "taxonomia" | "drilldown" | "aluno" | "turma";

export default function RelatorioPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [provaId, setProvaId] = useState<number | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [relTurma, setRelTurma] = useState<AlunoReport[]>([]);
  const [drilldown, setDrilldown] = useState<DrilldownData>({});
  const [taxonomia, setTaxonomia] = useState<TaxonomiaNode[]>([]);
  const [pontosCriticos, setPontosCriticos] = useState<AlunoPontosCriticos[]>([]);
  const [totalAlunos, setTotalAlunos] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [tab, setTab] = useState<Tab>("taxonomia");

  async function handleDownloadPdf() {
    if (!provaId || !prova) return;
    setDownloadingPdf(true);
    try {
      const nomeSeguro = (prova.titulo || `prova_${provaId}`).replace(/[^\w\s.-]/g, "_");
      await downloadRelatorioPdf(provaId, `EduMap_${nomeSeguro}.pdf`);
    } catch (e) {
      alert("Erro ao gerar PDF: " + (e instanceof Error ? e.message : "tente novamente"));
    } finally {
      setDownloadingPdf(false);
    }
  }

  useEffect(() => {
    getTurmas().then(ts => {
      setTurmas(ts);
      if (ts.length > 0) {
        const saved = typeof window !== "undefined" ? Number(localStorage.getItem("app_turmaId")) || null : null;
        const preferred = saved && ts.some(t => t.id === saved) ? saved : ts[0].id;
        setTurmaId(preferred);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    localStorage.setItem("app_turmaId", String(turmaId));
    setProvas([]);
    setProvaId(null);
    // Buscar total de alunos da turma para mostrar 'X de Y avaliados'
    getAlunos(turmaId).then(als => setTotalAlunos(als.length)).catch(() => setTotalAlunos(0));
    getProvas(turmaId).then(ps => {
      setProvas(ps);
      if (ps.length > 0) {
        const saved = typeof window !== "undefined" ? Number(localStorage.getItem("app_provaId")) || null : null;
        const preferred = saved && ps.some(p => p.id === saved) ? saved : ps[0].id;
        setProvaId(preferred);
      }
    }).catch(() => {});
  }, [turmaId]);

  useEffect(() => {
    if (provaId) localStorage.setItem("app_provaId", String(provaId));
  }, [provaId]);

  useEffect(() => {
    if (!provaId) return;
    setLoading(true);
    Promise.all([
      getQuestoes(provaId).catch(() => [] as Questao[]),
      getRelatorioTurma(provaId).catch(() => [] as AlunoReport[]),
      getRelatorioDrilldown(provaId).catch(() => ({} as DrilldownData)),
      getRelatorioTaxonomia(provaId).catch(() => ({ arvore: [] as TaxonomiaNode[] })),
      getPontosCriticos(provaId).catch(() => [] as AlunoPontosCriticos[]),
    ]).then(([q, r, d, tax, pc]) => {
      setQuestoes(q);
      setRelTurma(r);
      setDrilldown(d);
      setTaxonomia(tax.arvore || []);
      setPontosCriticos(pc);
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

      {/* Selectors PRIMEIRO — destaque visual */}
      <div className="card mb-4 border-l-4 border-blue-500">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">Selecione a turma e prova para ver o relatório:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Bloco de ajuda colapsável */}
      <details className="mb-6 group">
        <summary className="cursor-pointer select-none text-sm text-blue-700 hover:text-blue-900 font-medium px-2 py-1.5 rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5">
          <span className="transition-transform group-open:rotate-90">▶</span>
          ℹ️ Como ler este relatório?
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoBox variant="info" title="O que tem em cada aba?">
            <ul className="space-y-1 text-xs">
              <li>• <strong>Por Conteúdo (Detalhado):</strong> navegue até o tópico exato onde a turma errou.</li>
              <li>• <strong>Onde a Turma Errou:</strong> desempenho por área → subárea → nível de Bloom → aluno.</li>
              <li>• <strong>Por Aluno:</strong> ranking individual com pontos críticos de cada estudante.</li>
              <li>• <strong>Resumo Geral:</strong> média geral e os alunos que mais precisam de atenção.</li>
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
      </details>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <span className="animate-spin inline-block mr-2">⏳</span> Carregando relatório…
        </div>
      )}

      {!loading && prova && (
        <>
          {/* Botão de download */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || relTurma.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title={relTurma.length === 0 ? "Lance respostas antes de baixar o relatório" : "Baixar PDF do relatório completo"}
            >
              {downloadingPdf ? "Gerando PDF…" : "📥 Baixar relatório em PDF"}
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{prova.total_questoes}</div>
              <div className="text-xs text-gray-500 mt-1">Questões</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{prova.serie}</div>
              <div className="text-xs text-gray-500 mt-1">Série</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">
                {relTurma.length}{totalAlunos > 0 && <span className="text-base text-gray-400 font-normal"> de {totalAlunos}</span>}
              </div>
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

          {/* Status colorido baseado na média */}
          {media !== null && (() => {
            const cls = media >= 70
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : media >= 50
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-rose-50 border-rose-300 text-rose-800";
            const icon = media >= 70 ? "✓" : media >= 50 ? "↗" : "⚠";
            const text = media >= 70
              ? "Desempenho satisfatório — a turma está bem nesta avaliação."
              : media >= 50
                ? "Atenção: reforço recomendado em alguns conteúdos."
                : "Reforço urgente necessário — média abaixo de 50%.";
            return (
              <div className={`mb-6 px-4 py-3 rounded-lg border-l-4 text-sm font-medium ${cls}`}>
                <span className="font-bold mr-2">{icon}</span>{text}
              </div>
            );
          })()}

          {/* Tabs */}
          <div className="flex gap-2 mb-2 flex-wrap">
            {([
              ["taxonomia", "📂 Por Conteúdo (Detalhado)"],
              ["drilldown", "🔍 Onde a Turma Errou"],
              ["aluno",     "👤 Por Aluno"],
              ["turma",     "📊 Resumo Geral"],
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
          <p className="text-xs text-gray-500 mb-5">
            {{
              taxonomia: "Navegue até o conceito específico (ex: Triângulos › Equilátero) e veja onde a turma falha.",
              drilldown: "Mostra onde a turma tem dificuldades: área → subárea → nível cognitivo → aluno.",
              aluno:     "Lista cada aluno com seus acertos totais e os pontos que mais precisa reforçar.",
              turma:     "Visão consolidada da turma com distribuição de desempenho e alunos em atenção.",
            }[tab]}
          </p>

          {tab === "taxonomia" && <TaxonomiaTab tree={taxonomia} />}
          {tab === "drilldown" && (
            <DrilldownTab
              drilldown={drilldown}
              turmaNome={turma?.nome ?? ""}
              provaTitle={prova.titulo}
            />
          )}
          {tab === "aluno" && (
            <AlunoTab
              relTurma={relTurma}
              drilldown={drilldown}
              pontosCriticos={pontosCriticos}
            />
          )}
          {tab === "turma" && <TurmaTab relTurma={relTurma} questoes={questoes} />}

          {/* Botão PDF duplicado no rodapé (descritivo) */}
          {relTurma.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="btn-primary px-6 py-3 text-base disabled:opacity-50"
              >
                {downloadingPdf ? "Gerando PDF…" : "📥 Baixar relatório completo em PDF"}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Inclui diagnóstico por conteúdo, desempenho individual e visão geral da turma.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
