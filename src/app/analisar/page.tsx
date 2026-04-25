"use client";

import { useState, useEffect, useRef } from "react";
import { getTurmas, uploadProva, saveGabarito } from "@/lib/api";
import { YEAR_OPTIONS, YEAR_GROUPS, SUBJECT_OPTIONS, BLOOM_COLORS, BLOOM_NAMES, pctColor, pctIcon } from "@/lib/constants";
import type { Turma, PipelineResult, Question } from "@/lib/types";
import PctBadge from "@/components/PctBadge";
import BloomBadge from "@/components/BloomBadge";
import FlowBanner from "@/components/FlowBanner";
import InfoBox from "@/components/InfoBox";

type Tab = "geral" | "questoes" | "recomendacoes";

export default function AnalisarPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [year, setYear] = useState(YEAR_OPTIONS[5]);
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [turmaId, setTurmaId] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [tab, setTab] = useState<Tab>("geral");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTurmas().then(setTurmas).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo."); return; }
    setError("");
    setLoading(true);
    setProgress("Enviando arquivo…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("year_level", year);
      fd.append("subject", subject);
      if (turmaId !== "none") fd.append("turma_id", turmaId);
      setProgress("Processando OCR e classificando questões…");
      const res = await uploadProva(fd);
      setResult(res);
      setTab("geral");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar prova.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  if (result) return <ResultsView result={result} tab={tab} setTab={setTab} onBack={() => setResult(null)} />;

  return (
    <div>
      <FlowBanner step={2} />

      <h1 className="text-3xl font-bold text-gray-900 mb-1">EduMap</h1>
      <p className="text-gray-500 mb-5">Diagnóstico taxonômico de aprendizagem</p>

      <InfoBox variant="info" title="O que acontece nesta etapa?" className="mb-6">
        <ol className="space-y-1 list-none">
          <li><strong>1.</strong> Você faz o upload da prova (PDF ou foto/scan).</li>
          <li><strong>2.</strong> O sistema lê o texto das questões automaticamente via OCR.</li>
          <li><strong>3.</strong> Cada questão é classificada por <strong>área do conhecimento</strong> (Matemática, Português…) e por <strong>nível cognitivo de Bloom</strong> (Lembrar → Criar).</li>
          <li><strong>4.</strong> Após ver o resultado, preencha o <strong>gabarito</strong> (as respostas corretas) para poder lançar as respostas dos alunos depois.</li>
        </ol>
      </InfoBox>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-5 text-lg">Analisar nova prova</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Série / Ano</label>
                  <select className="input" value={year} onChange={e => setYear(e.target.value)}>
                    {YEAR_GROUPS.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Disciplina</label>
                  <select className="input" value={subject} onChange={e => setSubject(e.target.value)}>
                    {SUBJECT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Vincular a turma (opcional)</label>
                <select className="input" value={turmaId} onChange={e => setTurmaId(e.target.value)}>
                  <option value="none">(sem turma)</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} — {t.escola}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Arquivo da prova</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {file ? (
                    <div>
                      <p className="font-medium text-gray-900">📄 {file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500">Clique para selecionar ou arraste o arquivo</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG</p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

              {loading && (
                <div className="bg-blue-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <span className="animate-spin">⏳</span> {progress}
                  </div>
                  <div className="mt-2 bg-blue-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? "Processando…" : "🔍 Analisar Prova"}
              </button>
            </form>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Como funciona</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              {[
                "Faça upload da prova (foto ou PDF)",
                "Selecione série e disciplina",
                "O sistema faz OCR e identifica questões",
                "Classifica por área e Bloom",
                "Gera relatório diagnóstico",
              ].map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            💡 Boa iluminação na foto = melhor precisão do OCR.
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">📖 Taxonomia de Bloom</h3>
            <p className="text-xs text-gray-500 mb-3">Classificação do nível cognitivo de cada questão:</p>
            <div className="space-y-1.5">
              {[
                { n: 1, name: "Lembrar",     ex: "Defina, liste, cite" },
                { n: 2, name: "Compreender", ex: "Explique, descreva" },
                { n: 3, name: "Aplicar",     ex: "Calcule, resolva, use" },
                { n: 4, name: "Analisar",    ex: "Compare, examine" },
                { n: 5, name: "Avaliar",     ex: "Avalie, julgue, critique" },
                { n: 6, name: "Criar",       ex: "Elabore, crie, proponha" },
              ].map(b => {
                const c = BLOOM_COLORS[b.n];
                return (
                  <div key={b.n} className="flex items-center gap-2">
                    <span style={{ background: c, color: "#fff", borderRadius: 4, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, flexShrink: 0 }}>{b.n}</span>
                    <span className="text-xs text-gray-700"><strong>{b.name}</strong> — <span className="text-gray-400">{b.ex}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Results View ───────────────────────────────────────────────────────────────
function ResultsView({
  result, tab, setTab, onBack,
}: {
  result: PipelineResult;
  tab: Tab;
  setTab: (t: Tab) => void;
  onBack: () => void;
}) {
  const qs = result.questions;
  const bloomCounts: Record<number, number> = {};
  const areaCounts: Record<string, number> = {};
  for (const q of qs) {
    bloomCounts[q.bloom_level] = (bloomCounts[q.bloom_level] ?? 0) + 1;
    areaCounts[q.area_display] = (areaCounts[q.area_display] ?? 0) + 1;
  }
  const topArea = Object.entries(areaCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "—";
  const topBloom = Object.entries(bloomCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "0";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button onClick={onBack} className="btn-secondary text-sm mb-3">← Nova prova</button>
          <h2 className="text-xl font-bold text-gray-900">🗺️ {result.file_name}</h2>
          {result.prova_id && (
            <p className="text-sm text-gray-500">Prova salva no banco de dados (ID #{result.prova_id})</p>
          )}
        </div>
      </div>

      {/* Próximo passo */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800 flex items-start gap-2">
        <span className="text-base mt-0.5">➡️</span>
        <span>
          <strong>Próximo passo:</strong> preencha o gabarito abaixo (alternativas corretas de cada questão).
          Depois vá em <strong>Turmas e Alunos</strong> para cadastrar alunos e em <strong>Lançamento</strong> para registrar as respostas da turma.
        </span>
      </div>

      {/* Gabarito */}
      {result.prova_id && <GabaritoCard provaId={result.prova_id} questoes={qs} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Questões", value: qs.length },
          { label: "Extração", value: result.ocr_method.toUpperCase() },
          { label: "Área principal", value: topArea },
          { label: "Bloom principal", value: BLOOM_NAMES[Number(topBloom)] ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["geral", "questoes", "recomendacoes"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? "tab-btn-active" : "tab-btn-inactive"}`}
          >
            {{ geral: "📊 Visão Geral", questoes: "📋 Por Questão", recomendacoes: "💡 Recomendações" }[t]}
          </button>
        ))}
      </div>

      {tab === "geral" && <TabGeral qs={qs} bloomCounts={bloomCounts} areaCounts={areaCounts} />}
      {tab === "questoes" && <TabQuestoes qs={qs} />}
      {tab === "recomendacoes" && <TabRecomendacoes qs={qs} />}
    </div>
  );
}

// ── Tab: Visão Geral ───────────────────────────────────────────────────────────
function TabGeral({ qs, bloomCounts, areaCounts }: {
  qs: Question[];
  bloomCounts: Record<number, number>;
  areaCounts: Record<string, number>;
}) {
  const total = qs.length || 1;
  const maxArea = Math.max(...Object.values(areaCounts));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bloom distribution */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Bloom</h3>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(lvl => {
            const cnt = bloomCounts[lvl] ?? 0;
            const pct = Math.round(cnt * 100 / total);
            const c = BLOOM_COLORS[lvl];
            return (
              <div key={lvl} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 10 }}
                className="p-3 text-center">
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: c }}>{cnt}</div>
                <div className="text-xs font-semibold text-gray-700">{BLOOM_NAMES[lvl]}</div>
                <div className="text-xs text-gray-400">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area distribution */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Área</h3>
        <div className="space-y-3">
          {Object.entries(areaCounts).sort((a,b) => b[1]-a[1]).map(([area, cnt]) => (
            <div key={area}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{area}</span>
                <span className="text-gray-500">{cnt} questões</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(cnt / maxArea) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Por Questão ──────────────────────────────────────────────────────────
function TabQuestoes({ qs }: { qs: Question[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-4">{qs.length} questões identificadas</p>
      {qs.map(q => {
        const isOpen = open === q.number;
        const c = BLOOM_COLORS[q.bloom_level] ?? BLOOM_COLORS[0];
        return (
          <div key={q.number} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(isOpen ? null : q.number)}
            >
              <span className="font-medium text-gray-800">
                Q{q.number} — {q.area_display}
                {q.subarea_label && q.subarea_label !== "Geral" && (
                  <span className="text-gray-400 font-normal"> / {q.subarea_label}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ background: `${c}22`, color: c, padding: "2px 10px", borderRadius: 8, fontSize: ".8rem", fontWeight: 600 }}>
                  {q.bloom_name}
                </span>
                <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Enunciado</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {(q.stem || q.text).slice(0, 400)}{(q.stem || q.text).length > 400 ? "…" : ""}
                    </p>
                    {q.alternatives.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Alternativas</p>
                        {q.alternatives.slice(0, 5).map((a, i) => (
                          <p key={i} className="text-sm text-gray-700">{a}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <BloomBadge level={q.bloom_level} verb={q.bloom_verb} showVerb />
                    <div className="text-sm">
                      <span className="text-gray-500">Área: </span>
                      <span className="font-medium">{q.area_display}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Confiança</span>
                        <span>{Math.round(q.area_confidence * 100)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${q.area_confidence * 100}%` }} />
                      </div>
                    </div>
                    {q.bncc_skills.slice(0, 2).map(sk => (
                      <p key={sk.codigo} className="text-xs text-gray-500">
                        <code className="bg-gray-100 px-1 rounded">{sk.codigo}</code>{" "}
                        {sk.descricao?.slice(0, 50)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Gabarito Card ─────────────────────────────────────────────────────────────
function GabaritoCard({ provaId, questoes }: { provaId: number; questoes: Question[] }) {
  const [gabarito, setGabarito] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, value: string) {
    // Aceita A-E (multipla escolha) e V/F (verdadeiro/falso)
    const upper = value.toUpperCase().replace(/[^A-EVF]/g, "").slice(-1);
    setGabarito(prev => ({ ...prev, [questoes[i].number]: upper }));
    setSaved(false);
    if (upper && i < questoes.length - 1) {
      inputRefs.current[i + 1]?.focus();
      inputRefs.current[i + 1]?.select();
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveGabarito(provaId, gabarito);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const filled = Object.values(gabarito).filter(Boolean).length;

  return (
    <div className="card mb-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">🔑 Gabarito da prova</h3>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Salvo</span>}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Preencha as alternativas corretas: <strong>A–E</strong> para múltipla escolha ou <strong>V/F</strong> para verdadeiro/falso.
        Depois acesse <strong>Lançamento</strong> para registrar as respostas dos alunos.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {questoes.map((q, i) => {
          const isVF = q.tipo === "verdadeiro_falso";
          return (
            <div key={q.number} className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">Q{q.number}</span>
              <input
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={gabarito[q.number] ?? ""}
                onChange={e => handleChange(i, e.target.value)}
                placeholder={isVF ? "V/F" : "—"}
                title={isVF ? "Verdadeiro (V) ou Falso (F)" : "Múltipla escolha (A-E)"}
                className={`w-9 h-9 text-center uppercase font-bold border-2 rounded-lg focus:outline-none text-gray-900 bg-white ${
                  isVF
                    ? "border-amber-300 focus:border-amber-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {isVF && <span className="text-[9px] font-bold text-amber-600">V/F</span>}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSave}
        disabled={saving || filled === 0}
        className="btn-primary text-sm px-5 py-2"
      >
        {saving ? "Salvando…" : `Salvar Gabarito (${filled}/${questoes.length})`}
      </button>
    </div>
  );
}

// ── Tab: Recomendações ────────────────────────────────────────────────────────
const SUGS: Record<string, string> = {
  Lembrar: "Revisar o conteúdo teórico — flashcards, listas de resumo.",
  Compreender: "Trabalhar interpretação com leituras variadas e exemplos.",
  Aplicar: "Praticar com exercícios contextualizados do cotidiano.",
  Analisar: "Propor atividades de comparação e debate estruturado.",
  Avaliar: "Estimular argumentação escrita com critérios explícitos.",
  Criar: "Criar projetos, produções originais ou resolução aberta.",
};

function TabRecomendacoes({ qs }: { qs: Question[] }) {
  const bloomCounts: Record<string, number> = {};
  for (const q of qs) {
    const name = q.bloom_name;
    if (name && name !== "—") bloomCounts[name] = (bloomCounts[name] ?? 0) + 1;
  }

  const total = qs.length || 1;
  const entries = Object.entries(bloomCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-sm text-gray-500 mb-2">
        Recomendações pedagógicas baseadas na distribuição cognitiva da prova.
      </p>
      {entries.map(([name, cnt]) => {
        const pct = Math.round(cnt * 100 / total);
        const lvl = Object.entries(BLOOM_NAMES).find(([, v]) => v === name)?.[0];
        const color = BLOOM_COLORS[Number(lvl)] ?? BLOOM_COLORS[0];
        const type = pct >= 40 ? "critical" : pct >= 20 ? "warning" : "info";
        const bg = type === "critical" ? "#FEF2F2" : type === "warning" ? "#FFFBEB" : "#EFF6FF";
        const fg = type === "critical" ? "#991B1B" : type === "warning" ? "#92400E" : "#1E40AF";
        return (
          <div key={name} style={{ background: bg, borderRadius: 8, padding: "12px 16px", borderLeft: `4px solid ${color}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color, fontWeight: 700 }}>{name}</span>
              <span style={{ background: `${color}22`, color, fontSize: ".78rem", padding: "1px 8px", borderRadius: 10, fontWeight: 600 }}>
                {cnt} questão{cnt !== 1 ? "ões" : ""} ({pct}%)
              </span>
            </div>
            <p style={{ color: fg, fontSize: ".88rem" }}>{SUGS[name] ?? "Reforçar este nível cognitivo."}</p>
          </div>
        );
      })}
    </div>
  );
}
