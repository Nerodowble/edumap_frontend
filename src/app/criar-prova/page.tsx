"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import {
  getTurmas, criarProvaManual, getProvaEdicao,
  addQuestaoManual, updateQuestaoManual, deleteQuestao, publicarProva,
} from "@/lib/api";
import { useToast } from "@/components/Toast";
import { SUBJECT_GROUPS, YEAR_GROUPS, BLOOM_NAMES, BLOOM_COLORS } from "@/lib/constants";
import type { Turma, QuestaoEdicao } from "@/lib/types";

type Etapa = "metadados" | "questoes" | "publicar";
type TipoQ = "multipla_escolha" | "verdadeiro_falso";

export default function CriarProvaPage() {
  const router = useRouter();
  const toast = useToast();

  const [etapa, setEtapa] = useState<Etapa>("metadados");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [provaId, setProvaId] = useState<number | null>(null);

  // Metadados
  const [titulo, setTitulo] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [serie, setSerie] = useState("");
  const [tempoLimite, setTempoLimite] = useState<string>("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Questões
  const [questoes, setQuestoes] = useState<QuestaoEdicao[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [qStem, setQStem] = useState("");
  const [qTipo, setQTipo] = useState<TipoQ>("multipla_escolha");
  const [qAlternativas, setQAlternativas] = useState<string[]>(["", "", "", ""]);
  const [qGabarito, setQGabarito] = useState("A");
  const [qBloom, setQBloom] = useState<number>(0);
  const [savingQ, setSavingQ] = useState(false);

  // Publicar
  const [pin, setPin] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    getTurmas().then(setTurmas).catch(() => {});
  }, []);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setQStem("");
    setQTipo("multipla_escolha");
    setQAlternativas(["", "", "", ""]);
    setQGabarito("A");
    setQBloom(0);
  }

  async function salvarMetadados() {
    if (!titulo.trim()) { toast.err("Dê um título à prova."); return; }
    setSavingMeta(true);
    try {
      const prova = await criarProvaManual({
        titulo: titulo.trim(),
        turma_id: turmaId ? Number(turmaId) : null,
        disciplina,
        serie,
        tempo_limite_min: tempoLimite ? Number(tempoLimite) : null,
      });
      setProvaId(prova.id);
      setEtapa("questoes");
      toast.ok("Prova criada! Agora adicione as questões.");
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro ao criar prova.");
    } finally {
      setSavingMeta(false);
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
    const alts = qTipo === "verdadeiro_falso" ? [] : qAlternativas.map(a => a.trim()).filter(Boolean);
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
      if (editingId) {
        await updateQuestaoManual(provaId, editingId, {
          stem: qStem.trim(), alternativas: alts, gabarito: qGabarito.toUpperCase(),
          tipo: qTipo, bloom_nivel: qBloom, bloom_nome: bloomNome,
        });
        toast.ok("Questão atualizada.");
      } else {
        await addQuestaoManual(provaId, {
          stem: qStem.trim(), alternativas: alts, gabarito: qGabarito.toUpperCase(),
          tipo: qTipo, bloom_nivel: qBloom, bloom_nome: bloomNome,
        });
        toast.ok("Questão adicionada.");
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
      <div className="flex items-center gap-2 mb-6 text-sm">
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
              <span className={ativo ? "font-semibold text-gray-900" : "text-gray-500"}>
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
              <label className="label">Título da prova</label>
              <input className="input" placeholder="Ex: Avaliação - Comércio Exterior - Módulo 3"
                value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Turma</label>
                <select className="input" value={turmaId} onChange={e => setTurmaId(e.target.value)}>
                  <option value="">— Selecione —</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} {t.escola ? `(${t.escola})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tempo limite (minutos, opcional)</label>
                <input className="input" type="number" inputMode="numeric" min={1} placeholder="60"
                  value={tempoLimite} onChange={e => setTempoLimite(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Disciplina</label>
                <select className="input" value={disciplina} onChange={e => setDisciplina(e.target.value)}>
                  <option value="">— Selecione —</option>
                  {SUBJECT_GROUPS.map(g => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Série / Módulo</label>
                <select className="input" value={serie} onChange={e => setSerie(e.target.value)}>
                  <option value="">— Selecione —</option>
                  {YEAR_GROUPS.map(g => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </optgroup>
                  ))}
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
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{q.tipo === "verdadeiro_falso" ? "V/F" : `${q.alternativas.length} alt.`}</span>
                        <span>·</span>
                        <span>Gabarito: <strong>{q.gabarito}</strong></span>
                        {q.bloom_nivel > 0 && (
                          <>
                            <span>·</span>
                            <span className="px-1.5 py-0.5 rounded text-white text-xs"
                              style={{ background: BLOOM_COLORS[q.bloom_nivel] }}>
                              {BLOOM_NAMES[q.bloom_nivel]}
                            </span>
                          </>
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

              <div className="space-y-3">
                <div>
                  <label className="label">Enunciado</label>
                  <textarea className="input min-h-[100px]" rows={4}
                    placeholder="Escreva o enunciado da questão…"
                    value={qStem} onChange={e => setQStem(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tipo</label>
                    <select className="input" value={qTipo} onChange={e => setQTipo(e.target.value as TipoQ)}>
                      <option value="multipla_escolha">Múltipla escolha</option>
                      <option value="verdadeiro_falso">Verdadeiro ou Falso</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Nível Bloom (opcional)</label>
                    <select className="input" value={qBloom} onChange={e => setQBloom(Number(e.target.value))}>
                      <option value={0}>— sem classificação —</option>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} - {BLOOM_NAMES[n]}</option>
                      ))}
                    </select>
                  </div>
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
                            <button type="button" onClick={() => setQAlternativas(qAlternativas.filter((_, j) => j !== i))}
                              className="text-red-600 hover:text-red-700" aria-label="Remover alternativa">
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

                <div className="flex gap-2 pt-2">
                  <button onClick={resetForm} className="btn-secondary">Cancelar</button>
                  <button onClick={salvarQuestao} disabled={savingQ} className="btn-primary">
                    {savingQ ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar questão"}
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
