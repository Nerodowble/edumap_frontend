"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, CheckCircle2, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import {
  getTurmas, criarProvaManual, atualizarProvaManual, getProvaEdicao,
  addQuestaoManual, updateQuestaoManual, deleteQuestao, publicarProva,
  getTurmaContexto, errMsg,
} from "@/lib/api";
import { useToast } from "@/components/Toast";
import { SUBJECT_GROUPS, YEAR_GROUPS, BLOOM_NAMES, BLOOM_COLORS } from "@/lib/constants";
import type { Turma, QuestaoEdicao, TurmaContexto } from "@/lib/types";

type Etapa = "metadados" | "questoes" | "publicar";
type TipoQ = "multipla_escolha" | "verdadeiro_falso";

// Mapeia slug de etapa (curso_logistica, ef2, etc) ao label do grupo de séries
// dentro de YEAR_GROUPS. Quando o frontend conhecer um match, filtra o select
// de série; caso contrario mostra todas as opcoes.
function gruposParaEtapa(etapa: string): string[] {
  if (!etapa) return [];
  if (etapa === "ef1") return ["Ensino Fundamental"];
  if (etapa === "ef2") return ["Ensino Fundamental"];
  if (etapa === "em") return ["Ensino Médio"];
  if (etapa === "superior") return ["Graduação", "Pós-graduação"];
  if (etapa === "curso_dse") return ["Téc. Desenvolvimento de Sistemas (ETEC)"];
  if (etapa === "curso_administracao") return ["Téc. Administração (ETEC)"];
  if (etapa === "curso_logistica") return ["Téc. Logística (ETEC)"];
  if (etapa === "curso_iw") return ["Téc. Informática para Internet (ETEC)"];
  if (etapa === "curso_financas") return ["Téc. Finanças (ETEC)"];
  return [];
}

export default function CriarProvaPage() {
  const router = useRouter();
  const toast = useToast();

  const [etapa, setEtapa] = useState<Etapa>("metadados");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [provaId, setProvaId] = useState<number | null>(null);

  // Metadados
  const [titulo, setTitulo] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [contexto, setContexto] = useState<TurmaContexto | null>(null); // dados da etapa da turma
  const [disciplina, setDisciplina] = useState("");
  const [serie, setSerie] = useState("");
  const [tempoLimite, setTempoLimite] = useState<string>("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Cada vez que a turma muda, busca o contexto (etapa + materias) e zera os
  // selects encadeados se nao baterem com a nova etapa.
  useEffect(() => {
    if (!turmaId) { setContexto(null); setDisciplina(""); setSerie(""); return; }
    let cancelado = false;
    getTurmaContexto(Number(turmaId))
      .then(ctx => {
        if (cancelado) return;
        setContexto(ctx);
        // Reseta selects se ja estavam preenchidos com valores incompatíveis
        if (ctx.tem_filtro) {
          const matsValidas = new Set(ctx.materias.map(m => m.label));
          if (disciplina && !matsValidas.has(disciplina)) setDisciplina("");
          // Auto-preenche serie se a etapa for de curso técnico
          // (geralmente 1º/2º/3º Módulo - vamos derivar dos YEAR_GROUPS)
        }
      })
      .catch(() => setContexto(null));
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  // Questões
  const [questoes, setQuestoes] = useState<QuestaoEdicao[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [qStem, setQStem] = useState("");
  const [qTipo, setQTipo] = useState<TipoQ>("multipla_escolha");
  const [qAlternativas, setQAlternativas] = useState<string[]>(["", "", "", ""]);
  const [qGabarito, setQGabarito] = useState("A");
  const [qBloom, setQBloom] = useState<number>(0); // override manual; 0 = deixar IA decidir
  const [savingQ, setSavingQ] = useState(false);
  const [showAvancado, setShowAvancado] = useState(false);

  // Publicar
  const [pin, setPin] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    getTurmas().then(setTurmas).catch(() => {});
  }, []);

  // Retomar rascunho: /criar-prova?id=123
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!id) return;
    getProvaEdicao(id)
      .then(({ prova, questoes: qs }) => {
        if (prova.status && prova.status !== "rascunho") {
          toast.warn("Esta prova já foi publicada e não pode mais ser editada.");
          router.replace(`/aplicar/${prova.id}`);
          return;
        }
        setProvaId(prova.id);
        setTitulo(prova.titulo || "");
        setTurmaId(prova.turma_id ? String(prova.turma_id) : "");
        setDisciplina(prova.disciplina || "");
        setSerie(prova.serie || "");
        setTempoLimite(prova.tempo_limite_min ? String(prova.tempo_limite_min) : "");
        setQuestoes(qs);
        setEtapa("questoes");
      })
      .catch(err => toast.err(errMsg(err, "Não foi possível abrir o rascunho.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setQStem("");
    setQTipo("multipla_escolha");
    setQAlternativas(["", "", "", ""]);
    setQGabarito("A");
    setQBloom(0);
    setShowAvancado(false);
  }

  async function salvarMetadados() {
    if (!titulo.trim()) { toast.err("Dê um título à prova."); return; }
    if (!turmaId) { toast.err("Escolha a turma que vai fazer a prova."); return; }
    const dados = {
      titulo: titulo.trim(),
      turma_id: Number(turmaId),
      disciplina,
      serie,
      tempo_limite_min: tempoLimite ? Number(tempoLimite) : null,
    };
    setSavingMeta(true);
    try {
      if (provaId) {
        // Voltou para corrigir: atualiza a MESMA prova (antes criava outra e perdia as questões)
        await atualizarProvaManual(provaId, dados);
        toast.ok("Informações atualizadas.");
      } else {
        const prova = await criarProvaManual(dados);
        setProvaId(prova.id);
        window.history.replaceState(null, "", `/criar-prova?id=${prova.id}`);
        toast.ok("Prova criada! Agora adicione as questões.");
      }
      setEtapa("questoes");
    } catch (err) {
      toast.err(errMsg(err, "Não foi possível salvar a prova."));
    } finally {
      setSavingMeta(false);
    }
  }

  /** Remove a alternativa i mantendo o gabarito apontando para o mesmo TEXTO. */
  function removerAlternativa(i: number) {
    const gabIdx = qGabarito.charCodeAt(0) - 65;
    setQAlternativas(qAlternativas.filter((_, j) => j !== i));
    if (gabIdx === i) {
      setQGabarito("A");
      toast.warn("Você removeu a alternativa do gabarito. Marque a resposta correta novamente.");
    } else if (gabIdx > i) {
      setQGabarito(String.fromCharCode(65 + gabIdx - 1));
    }
  }

  function startNova() {
    resetForm();
    setShowForm(true);
  }

  function startEditar(q: QuestaoEdicao) {
    setEditingId(q.id);
    setQStem(q.stem);
    setQTipo(q.tipo);
    setQAlternativas(q.tipo === "verdadeiro_falso" ? [] : (q.alternativas.length ? q.alternativas : ["", "", "", ""]));
    setQGabarito(q.gabarito || "A");
    setQBloom(q.bloom_nivel || 0);
    setShowForm(true);
  }

  async function salvarQuestao() {
    if (!provaId) return;
    if (!qStem.trim()) { toast.err("Escreva o enunciado."); return; }
    // Não filtra vazias: remover uma do meio deslocaria as letras e trocaria o gabarito sem aviso
    const alts = qTipo === "verdadeiro_falso" ? [] : qAlternativas.map(a => a.trim());
    if (qTipo === "multipla_escolha" && alts.some(a => !a)) {
      toast.err("Preencha todas as alternativas ou remova as que estiverem vazias.");
      return;
    }
    if (qTipo === "multipla_escolha" && alts.length < 2) {
      toast.err("Adicione pelo menos 2 alternativas.");
      return;
    }
    const gabValid = qTipo === "verdadeiro_falso"
      ? ["V", "F"].includes(qGabarito.toUpperCase())
      : qGabarito && qGabarito.charCodeAt(0) - 65 < alts.length;
    if (!gabValid) { toast.err("Selecione um gabarito válido."); return; }

    const bloomNome = qBloom > 0 ? BLOOM_NAMES[qBloom] : "";

    setSavingQ(true);
    try {
      let auto: { area_display?: string; bloom_nome?: string; taxonomia_label?: string } = {};
      if (editingId) {
        const r = await updateQuestaoManual(provaId, editingId, {
          stem: qStem.trim(), alternativas: alts, gabarito: qGabarito.toUpperCase(),
          tipo: qTipo, bloom_nivel: qBloom, bloom_nome: bloomNome,
        });
        auto = (r as { classificacao_automatica?: typeof auto }).classificacao_automatica || {};
        toast.ok("Questão atualizada.");
      } else {
        const r = await addQuestaoManual(provaId, {
          stem: qStem.trim(), alternativas: alts, gabarito: qGabarito.toUpperCase(),
          tipo: qTipo, bloom_nivel: qBloom, bloom_nome: bloomNome,
        });
        auto = (r as { classificacao_automatica?: typeof auto }).classificacao_automatica || {};
        const partes = [
          auto.bloom_nome && `Bloom: ${auto.bloom_nome}`,
          auto.area_display && `Área: ${auto.area_display}`,
          auto.taxonomia_label && `Tópico: ${auto.taxonomia_label}`,
        ].filter(Boolean).join(" · ");
        toast.ok(partes ? `Adicionada! ${partes}` : "Questão adicionada.");
      }
      const data = await getProvaEdicao(provaId);
      setQuestoes(data.questoes);
      resetForm();
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro.");
    } finally {
      setSavingQ(false);
    }
  }

  async function removerQuestao(qid: number) {
    if (!provaId) return;
    if (!confirm("Remover esta questão?")) return;
    try {
      await deleteQuestao(provaId, qid);
      const data = await getProvaEdicao(provaId);
      setQuestoes(data.questoes);
      toast.ok("Questão removida.");
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro.");
    }
  }

  async function handlePublicar() {
    if (!provaId) return;
    if (questoes.length === 0) { toast.err("Adicione ao menos uma questão antes."); return; }
    if (!turmaId) { toast.err("Vincule a prova a uma turma antes de publicar."); return; }
    setPublicando(true);
    try {
      const r = await publicarProva(provaId, tempoLimite ? Number(tempoLimite) : null);
      setPin(r.pin);
      setEtapa("publicar");
      toast.ok("Prova publicada!");
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => router.push("/turmas")}
        className="text-blue-700 text-sm hover:underline mb-3 flex items-center gap-1"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Criar prova</h1>
      <p className="text-gray-500 mb-6">Monte sua prova questão por questão. Quando estiver pronta, publique com um PIN.</p>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        {(["metadados", "questoes", "publicar"] as Etapa[]).map((e, i) => {
          const ativo = etapa === e;
          const passado = (["metadados", "questoes", "publicar"] as Etapa[]).indexOf(etapa) > i;
          return (
            <div key={e} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                ativo ? "bg-blue-700 text-white" :
                passado ? "bg-emerald-600 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {passado ? "✓" : i + 1}
              </div>
              {/* No celular só o passo atual mostra o nome (evita rolagem horizontal) */}
              <span className={ativo ? "font-semibold text-gray-900" : "text-gray-500 hidden sm:inline"}>
                {e === "metadados" ? "Informações" : e === "questoes" ? "Questões" : "Publicar"}
              </span>
              {i < 2 && <span className="text-gray-300 mx-1">—</span>}
            </div>
          );
        })}
      </div>

      {/* ETAPA 1 — METADADOS */}
      {etapa === "metadados" && (
        <div className="card max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4">1. Informações básicas</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="cp-titulo" className="label">Título da prova</label>
              <input id="cp-titulo" className="input" placeholder="Ex: Avaliação - Comércio Exterior - Módulo 3"
                value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cp-turma" className="label">Turma <span className="text-red-700">*</span></label>
                <select id="cp-turma" className="input" value={turmaId} onChange={e => setTurmaId(e.target.value)} required>
                  <option value="">— Selecione —</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nome} {t.escola ? `(${t.escola})` : ""}{t.etapa ? "" : " ⚠"}
                    </option>
                  ))}
                </select>
                {turmaId && contexto && contexto.tem_filtro && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Etapa: <strong>{contexto.etapa_label}</strong> — as opções abaixo foram filtradas.
                  </p>
                )}
                {turmaId && contexto && !contexto.tem_filtro && (
                  <p className="text-xs text-amber-700 mt-1">
                    ⚠ Esta turma não tem etapa definida. Edite a turma em <a href="/turmas" className="underline">Turmas</a> para que as disciplinas e módulos certos apareçam aqui.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cp-tempo" className="label">Tempo limite (minutos, opcional)</label>
                <input id="cp-tempo" className="input" type="number" inputMode="numeric" min={1} placeholder="60"
                  value={tempoLimite} onChange={e => setTempoLimite(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cp-disciplina" className="label">Disciplina</label>
                <select
                  id="cp-disciplina"
                  className="input"
                  value={disciplina}
                  onChange={e => setDisciplina(e.target.value)}
                  disabled={!turmaId}
                >
                  <option value="">{turmaId ? "— Selecione —" : "Escolha a turma primeiro"}</option>
                  {contexto && contexto.tem_filtro ? (
                    /* Filtrado pela etapa da turma — só disciplinas daquela etapa */
                    contexto.materias.map(m => (
                      <option key={m.materia} value={m.label}>{m.label}</option>
                    ))
                  ) : (
                    /* Sem filtro (turma sem etapa) — mostra tudo */
                    SUBJECT_GROUPS.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="cp-serie" className="label">Série / Módulo</label>
                <select
                  id="cp-serie"
                  className="input"
                  value={serie}
                  onChange={e => setSerie(e.target.value)}
                  disabled={!turmaId}
                >
                  <option value="">{turmaId ? "— Selecione —" : "Escolha a turma primeiro"}</option>
                  {(() => {
                    const gruposPermitidos = contexto && contexto.tem_filtro
                      ? new Set(gruposParaEtapa(contexto.etapa))
                      : null;
                    const filtrados = gruposPermitidos
                      ? YEAR_GROUPS.filter(g => gruposPermitidos.has(g.label))
                      : YEAR_GROUPS;
                    return filtrados.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <button onClick={salvarMetadados} disabled={savingMeta} className="btn-primary mt-2">
              {savingMeta ? "Salvando…" : "Continuar →"}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2 — QUESTÕES */}
      {etapa === "questoes" && (
        <div>
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">2. Questões ({questoes.length})</h2>
              <button onClick={startNova} className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
                <Plus size={16} /> Nova questão
              </button>
            </div>

            {questoes.length === 0 && !showForm && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Nenhuma questão ainda. Clique em <strong>Nova questão</strong> pra começar.
              </div>
            )}

            <ul className="space-y-2">
              {questoes.map(q => (
                <li key={q.id} className="border border-gray-200 rounded-xl p-3 hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-8 h-8 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {q.numero}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 line-clamp-2">{q.stem}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                        <span className="text-gray-500">
                          {q.tipo === "verdadeiro_falso" ? "V/F" : `${q.alternativas.length} alt.`}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500">Gabarito <strong className="text-gray-800">{q.gabarito}</strong></span>

                        {q.bloom_nivel > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-white"
                            style={{ background: BLOOM_COLORS[q.bloom_nivel] }}
                            title={`Nível ${q.bloom_nivel} de Bloom`}>
                            {BLOOM_NAMES[q.bloom_nivel]}
                          </span>
                        )}
                        {q.area_display && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            {q.area_display}
                          </span>
                        )}
                        {q.taxonomia_codigo && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono text-[10px]"
                            title="Nó da taxonomia">
                            {q.taxonomia_codigo}
                          </span>
                        )}
                        {!q.bloom_nivel && !q.area_display && !q.taxonomia_codigo && (
                          <span className="text-amber-600 italic">sem classificação</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditar(q)} className="text-blue-700 text-xs hover:underline">Editar</button>
                      <button onClick={() => removerQuestao(q.id)} className="text-red-600 hover:text-red-700" aria-label="Remover">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form de nova/editar questão */}
          {showForm && (
            <div className="card mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {editingId ? "Editar questão" : "Nova questão"}
              </h3>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 mb-3 text-xs text-blue-800 flex items-start gap-2">
                <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Classificação automática:</strong> ao salvar, o sistema vai sugerir o nível Bloom,
                  a área e o nó da taxonomia desta questão com base no enunciado. Você pode revisar e ajustar depois.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label">Enunciado</label>
                  <textarea className="input min-h-[100px]" rows={4}
                    placeholder="Escreva o enunciado da questão…"
                    value={qStem} onChange={e => setQStem(e.target.value)} />
                </div>

                <div>
                  <label className="label">Tipo</label>
                  <select className="input max-w-xs" value={qTipo} onChange={e => setQTipo(e.target.value as TipoQ)}>
                    <option value="multipla_escolha">Múltipla escolha</option>
                    <option value="verdadeiro_falso">Verdadeiro ou Falso</option>
                  </select>
                </div>

                {qTipo === "multipla_escolha" ? (
                  <div>
                    <label className="label">Alternativas (mínimo 2)</label>
                    {qAlternativas.map((alt, i) => {
                      const letra = String.fromCharCode(65 + i);
                      const isGab = qGabarito === letra;
                      return (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setQGabarito(letra)}
                            aria-label={`Marcar ${letra} como gabarito`}
                            className={`w-8 h-8 shrink-0 rounded-full font-bold ${
                              isGab ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {letra}
                          </button>
                          <input
                            className="input flex-1"
                            placeholder={`Alternativa ${letra}`}
                            value={alt}
                            onChange={e => {
                              const next = [...qAlternativas]; next[i] = e.target.value; setQAlternativas(next);
                            }}
                          />
                          {qAlternativas.length > 2 && (
                            <button type="button" onClick={() => removerAlternativa(i)}
                              className="text-red-600 hover:text-red-700 p-2" aria-label={`Remover alternativa ${letra}`}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {qAlternativas.length < 5 && (
                      <button type="button" onClick={() => setQAlternativas([...qAlternativas, ""])}
                        className="text-blue-700 text-sm hover:underline">
                        + Adicionar alternativa
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Clique na letra para marcar como gabarito.</p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Gabarito</label>
                    <div className="flex gap-2">
                      {["V", "F"].map(g => (
                        <button key={g} type="button"
                          onClick={() => setQGabarito(g)}
                          className={`flex-1 py-2 rounded-lg font-bold ${
                            qGabarito === g ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}>
                          {g === "V" ? "Verdadeiro" : "Falso"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <button type="button" onClick={() => setShowAvancado(!showAvancado)}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                    {showAvancado ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Avançado: forçar nível Bloom manualmente
                  </button>
                  {showAvancado && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="label text-xs">Nível Bloom (deixe em "automático" para o sistema decidir)</label>
                      <select className="input" value={qBloom} onChange={e => setQBloom(Number(e.target.value))}>
                        <option value={0}>Automático (recomendado)</option>
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} - {BLOOM_NAMES[n]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={resetForm} className="btn-secondary">Cancelar</button>
                  <button onClick={salvarQuestao} disabled={savingQ} className="btn-primary">
                    {savingQ ? "Classificando…" : editingId ? "Salvar alterações" : "Adicionar questão"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ações inferiores */}
          {questoes.length > 0 && (
            <div className="flex justify-between items-center gap-3">
              <button onClick={() => setEtapa("metadados")} className="btn-secondary">← Voltar</button>
              <button onClick={handlePublicar} disabled={publicando} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
                <Send size={16} /> {publicando ? "Publicando…" : "Publicar prova"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ETAPA 3 — PUBLICADA */}
      {etapa === "publicar" && pin && provaId && (
        <div className="card max-w-md mx-auto text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Prova publicada!</h2>
          <p className="text-gray-600 text-sm mb-5">
            Mostre o PIN abaixo para a turma. Cada aluno entra no celular em <strong>/aluno</strong>.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-5">
            <div className="text-xs uppercase tracking-wider text-blue-700 font-bold mb-1">PIN da prova</div>
            <div className="text-5xl font-mono font-bold text-blue-700 tabular-nums tracking-[0.2em]">{pin}</div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => router.push(`/aplicar/${provaId}`)} className="btn-primary">
              Ir para o monitor da aplicação →
            </button>
            <button onClick={() => router.push("/turmas")} className="btn-secondary">
              Voltar para turmas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
