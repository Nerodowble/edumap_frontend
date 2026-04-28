"use client";

import { useState, useEffect } from "react";
import {
  UserPlus, ClipboardPaste, ArrowDown, Lock, Check, Pencil, Trash2, FileText, X as XIcon,
} from "lucide-react";
import {
  getTurmas, createTurma, getAlunos, createAluno, getProvas,
  updateTurma, deleteTurma, updateAluno, deleteAluno,
} from "@/lib/api";
import type { Turma, Aluno, Prova } from "@/lib/types";
import FlowBanner from "@/components/FlowBanner";
import InfoBox from "@/components/InfoBox";
import { useToast } from "@/components/Toast";

export default function TurmasPage() {
  const toast = useToast();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [turmaNome, setTurmaNome] = useState("");
  const [turmaEscola, setTurmaEscola] = useState("");
  const [turmaDisc, setTurmaDisc] = useState("");
  const [alunoNome, setAlunoNome] = useState("");
  const [alunoTurmaId, setAlunoTurmaId] = useState<string>("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkNomes, setBulkNomes] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { setTurmas(await getTurmas()); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreateTurma(e: React.FormEvent) {
    e.preventDefault();
    if (!turmaNome.trim()) return;
    try {
      await createTurma({ nome: turmaNome, escola: turmaEscola, disciplina: turmaDisc });
      const nome = turmaNome;
      setTurmaNome(""); setTurmaEscola(""); setTurmaDisc("");
      toast.ok(`Turma "${nome}" criada com sucesso!`);
      await load();
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro ao criar turma.");
    }
  }

  async function handleCreateAluno(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoNome.trim() || !alunoTurmaId) return;
    try {
      await createAluno(Number(alunoTurmaId), alunoNome);
      const nome = alunoNome;
      setAlunoNome("");
      toast.ok(`Aluno "${nome}" adicionado!`);
      await load();
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro ao adicionar aluno.");
    }
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoTurmaId || !bulkNomes.trim()) return;
    const nomes = bulkNomes.split("\n").map(n => n.trim()).filter(Boolean);
    if (nomes.length === 0) return;
    setBulkLoading(true);
    let ok = 0, fail = 0;
    for (const nome of nomes) {
      try { await createAluno(Number(alunoTurmaId), nome); ok++; }
      catch { fail++; }
    }
    setBulkNomes("");
    setBulkLoading(false);
    if (fail > 0) {
      toast.warn(`${ok} aluno(s) importado(s), ${fail} falharam.`);
    } else {
      toast.ok(`${ok} aluno${ok !== 1 ? "s" : ""} importado${ok !== 1 ? "s" : ""} com sucesso!`);
    }
    await load();
  }

  return (
    <div>
      <FlowBanner step={1} />

      <h1 className="text-2xl font-bold text-gray-900 mb-1">👥 Turmas e Alunos</h1>
      <p className="text-gray-500 mb-5">Gerencie suas turmas e alunos para vincular às provas.</p>

      <InfoBox variant="info" title="Por que cadastrar turmas e alunos?" className="mb-6">
        <ul className="space-y-1">
          <li>• <strong>Turmas</strong> agrupam alunos e permitem vincular provas a uma classe específica.</li>
          <li>• <strong>Alunos</strong> precisam estar cadastrados para que o relatório mostre o desempenho individual de cada um.</li>
          <li>• Ao fazer o upload de uma prova em <strong>Analisar Prova</strong>, você poderá vincular a uma turma existente.</li>
          <li>• Depois, em <strong>Lançamento</strong>, as respostas de cada aluno serão lançadas por nome.</li>
        </ul>
      </InfoBox>

      {/* PASSO 1 — Criar turma */}
      <div className="card mb-3 border-l-4 border-blue-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
            {turmas.length > 0 ? <Check size={18} /> : "1"}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Passo 1 — Criar uma turma</h2>
            <p className="text-xs text-gray-500">Cadastre o nome da turma, escola e disciplina principal.</p>
          </div>
        </div>
        <form onSubmit={handleCreateTurma} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Nome da turma</label>
            <input className="input" placeholder="Ex: 8º ano B" value={turmaNome} onChange={e => setTurmaNome(e.target.value)} />
          </div>
          <div>
            <label className="label">Escola</label>
            <input className="input" placeholder="Ex: E.E. João da Silva" value={turmaEscola} onChange={e => setTurmaEscola(e.target.value)} />
          </div>
          <div>
            <label className="label">Disciplina <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input className="input" placeholder="Ex: Matemática" value={turmaDisc} onChange={e => setTurmaDisc(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn-primary w-full md:w-auto md:px-8">Criar turma</button>
          </div>
        </form>
      </div>

      {/* Indicador de transição */}
      <div className="flex justify-center mb-3 text-gray-400">
        <ArrowDown size={20} />
      </div>

      {/* PASSO 2 — Adicionar alunos */}
      <div className={`card mb-8 border-l-4 ${turmas.length === 0 ? "border-gray-300 bg-gray-50/50" : "border-emerald-500"}`}>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center flex-shrink-0 ${
              turmas.length === 0 ? "bg-gray-300 text-gray-500" : "bg-emerald-600 text-white"
            }`}>
              {turmas.length === 0 ? <Lock size={16} /> : "2"}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Passo 2 — Adicionar alunos à turma</h2>
              <p className="text-xs text-gray-500">
                {turmas.length === 0
                  ? "Crie uma turma primeiro para habilitar este passo."
                  : "Adicione um aluno por vez ou cole uma lista pronta."}
              </p>
            </div>
          </div>
          {turmas.length > 0 && (
            <div className="flex text-xs border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setBulkMode(false)}
                className={`px-3 py-2 transition-colors flex items-center gap-1.5 ${!bulkMode ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <UserPlus size={13} /> Adicionar um aluno
              </button>
              <button
                type="button"
                onClick={() => setBulkMode(true)}
                className={`px-3 py-2 transition-colors flex items-center gap-1.5 ${bulkMode ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <ClipboardPaste size={13} /> Colar lista
              </button>
            </div>
          )}
        </div>

        {turmas.length > 0 && (
          <>
            <div className="mb-3">
              <label className="label">Turma</label>
              <select className="input" value={alunoTurmaId} onChange={e => setAlunoTurmaId(e.target.value)}>
                <option value="">— Selecionar turma —</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} — {t.escola}</option>
                ))}
              </select>
            </div>

            {!bulkMode ? (
              <form onSubmit={handleCreateAluno} className="space-y-3">
                <div>
                  <label className="label">Nome do aluno</label>
                  <input className="input" placeholder="Nome completo" value={alunoNome} onChange={e => setAlunoNome(e.target.value)} />
                </div>
                <button type="submit" disabled={!alunoTurmaId || !alunoNome.trim()} className="btn-primary w-full md:w-auto md:px-8">
                  Adicionar aluno
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkImport} className="space-y-3">
                <div>
                  <label className="label">📋 Cole abaixo a lista de nomes — um por linha:</label>
                  <textarea
                    className="input min-h-[160px] resize-y font-mono text-sm"
                    placeholder={"Ana Carolina Silva\nBruno Mendes Costa\nCarlos Eduardo Lima"}
                    value={bulkNomes}
                    onChange={e => setBulkNomes(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {bulkNomes.split("\n").filter(n => n.trim()).length} aluno(s) na lista
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={bulkLoading || !alunoTurmaId || bulkNomes.trim().length === 0}
                  className="btn-primary w-full md:w-auto md:px-8"
                >
                  {bulkLoading
                    ? "Importando…"
                    : `Importar ${bulkNomes.split("\n").filter(n => n.trim()).length} aluno(s)`}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Lista de turmas */}
      <h2 className="font-semibold text-gray-900 mb-3">Turmas cadastradas</h2>
      {loading && <p className="text-gray-400 text-sm">Carregando…</p>}
      {!loading && turmas.length === 0 && (
        <div className="card text-center text-gray-500 py-10">
          Nenhuma turma cadastrada ainda.
        </div>
      )}
      <div className="space-y-2">
        {turmas.map(t => (
          <TurmaRow key={t.id} turma={t} open={expanded === t.id} onToggle={() => setExpanded(expanded === t.id ? null : t.id)} onChanged={load} />
        ))}
      </div>
    </div>
  );
}

/** Limpa nome de arquivo para exibição:
 * - Remove extensão
 * - Tira hashes/uuids longos no início (10+ digitos seguidos)
 * - Substitui underscores por espaços
 * - Capitaliza palavras-chave
 */
function nomeAmigavelProva(p: Prova): string {
  if (p.titulo && p.titulo.trim()) {
    const t = p.titulo.replace(/\.[a-z0-9]{2,5}$/i, "").trim();
    // Se o titulo é só números/hash, usa fallback
    if (!/^[\d\-_]+$/.test(t) && t.length > 3) return t;
  }
  const arq = (p.arquivo_nome || "").replace(/\.[a-z0-9]{2,5}$/i, "");
  // Se for um hash/UUID puro, usa data
  if (/^\d{8,}$/.test(arq) || /^[a-f0-9-]{20,}$/i.test(arq)) {
    return `Prova enviada em ${p.criado_em.slice(0, 10)}`;
  }
  // Substitui _ e - por espaços
  const limpo = arq.replace(/[_\-]+/g, " ").trim();
  return limpo || `Prova enviada em ${p.criado_em.slice(0, 10)}`;
}

interface TurmaRowProps {
  turma: Turma;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}

function TurmaRow({ turma, open, onToggle, onChanged }: TurmaRowProps) {
  const toast = useToast();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingTurma, setEditingTurma] = useState(false);
  const [tNome, setTNome] = useState(turma.nome);
  const [tEscola, setTEscola] = useState(turma.escola);
  const [tDisc, setTDisc] = useState(turma.disciplina ?? "");
  const [editingAlunoId, setEditingAlunoId] = useState<number | null>(null);
  const [editAlunoNome, setEditAlunoNome] = useState("");

  async function load() {
    const [a, p] = await Promise.all([
      getAlunos(turma.id).catch(() => [] as Aluno[]),
      getProvas(turma.id).catch(() => [] as Prova[]),
    ]);
    setAlunos(a);
    setProvas(p);
    setLoaded(true);
  }

  function handleToggle() {
    if (!open && !loaded) load();
    onToggle();
  }

  async function handleSaveTurma() {
    if (!tNome.trim()) { toast.err("Nome da turma não pode ficar vazio."); return; }
    try {
      await updateTurma(turma.id, { nome: tNome.trim(), escola: tEscola.trim(), disciplina: tDisc.trim() });
      setEditingTurma(false);
      toast.ok("Turma atualizada!");
      onChanged();
    } catch (e) {
      toast.err(e instanceof Error ? e.message : "Erro ao atualizar turma.");
    }
  }

  async function handleDeleteTurma() {
    if (!confirm(`Deletar a turma "${turma.nome}" e todos os seus alunos? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteTurma(turma.id);
      toast.ok(`Turma "${turma.nome}" removida.`);
      onChanged();
    } catch (e) {
      toast.err(e instanceof Error ? e.message : "Erro ao deletar turma.");
    }
  }

  async function handleSaveAluno(alunoId: number) {
    if (!editAlunoNome.trim()) return;
    try {
      await updateAluno(alunoId, editAlunoNome.trim());
      setEditingAlunoId(null);
      toast.ok("Aluno atualizado!");
      await load();
    } catch (e) {
      toast.err(e instanceof Error ? e.message : "Erro ao atualizar aluno.");
    }
  }

  async function handleDeleteAluno(a: Aluno) {
    if (!confirm(`Remover o aluno "${a.nome}" desta turma?`)) return;
    try {
      await deleteAluno(a.id);
      toast.ok(`Aluno "${a.nome}" removido.`);
      await load();
    } catch (e) {
      toast.err(e instanceof Error ? e.message : "Erro ao remover aluno.");
    }
  }

  return (
    <div className="card p-0 overflow-hidden">
      {!editingTurma ? (
        <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-3">
          <button onClick={handleToggle} className="flex-1 flex items-center justify-between text-left min-w-0 gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-gray-900">{turma.nome}</span>
              {turma.escola && <><span className="text-gray-400 mx-2">—</span><span className="text-gray-600">{turma.escola}</span></>}
              {turma.disciplina && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{turma.disciplina}</span>}
            </div>
            <span className="text-gray-400 text-xs flex-shrink-0">{open ? "Ver alunos e provas ▲" : "Ver alunos e provas ▼"}</span>
          </button>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setEditingTurma(true)}
              title="Editar dados da turma"
              aria-label="Editar turma"
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={handleDeleteTurma}
              title="Remover esta turma"
              aria-label="Remover turma"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 bg-blue-50 border-l-4 border-blue-500 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" value={tNome} onChange={e => setTNome(e.target.value)} placeholder="Nome da turma" />
          <input className="input" value={tEscola} onChange={e => setTEscola(e.target.value)} placeholder="Escola" />
          <input className="input" value={tDisc} onChange={e => setTDisc(e.target.value)} placeholder="Disciplina" />
          <div className="md:col-span-3 flex gap-2">
            <button onClick={handleSaveTurma} className="btn-primary text-sm">Salvar</button>
            <button onClick={() => { setEditingTurma(false); setTNome(turma.nome); setTEscola(turma.escola); setTDisc(turma.disciplina ?? ""); }} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {open && !editingTurma && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Alunos {alunos.length > 0 && <span className="text-blue-600">({alunos.length})</span>}
              </p>
              {alunos.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum aluno cadastrado.</p>
              ) : (
                <div className="space-y-1">
                  {alunos.map(a => (
                    <div key={a.id} className="text-sm text-gray-700 flex items-center gap-2 group">
                      {editingAlunoId === a.id ? (
                        <>
                          <input
                            value={editAlunoNome}
                            onChange={e => setEditAlunoNome(e.target.value)}
                            className="input flex-1 text-sm py-1.5"
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") handleSaveAluno(a.id); if (e.key === "Escape") setEditingAlunoId(null); }}
                          />
                          <button onClick={() => handleSaveAluno(a.id)} className="text-green-600 hover:text-green-800 p-1" title="Salvar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingAlunoId(null)} className="text-gray-400 hover:text-gray-600 p-1" title="Cancelar">
                            <XIcon size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                          <span className="flex-1">{a.nome}</span>
                          <button
                            onClick={() => { setEditingAlunoId(a.id); setEditAlunoNome(a.nome); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 p-1 transition-opacity"
                            title="Editar nome do aluno"
                            aria-label="Editar aluno"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAluno(a)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 transition-opacity"
                            title="Remover aluno"
                            aria-label="Remover aluno"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Provas {provas.length > 0 && <span className="text-blue-600">({provas.length})</span>}
              </p>
              {provas.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma prova analisada.</p>
              ) : (
                <div className="space-y-1">
                  {provas.map(p => (
                    <div key={p.id} className="text-sm text-gray-700 flex items-start gap-2" title={p.arquivo_nome}>
                      <FileText size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{nomeAmigavelProva(p)}</div>
                        <div className="text-xs text-gray-400">{p.serie} — {p.total_questoes} questões — {p.criado_em.slice(0, 10)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
