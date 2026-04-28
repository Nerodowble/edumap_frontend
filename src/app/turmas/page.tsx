"use client";

import { useState, useEffect } from "react";
import {
  UserPlus, ClipboardPaste, ArrowDown, Lock, Check,
} from "lucide-react";
import { getTurmas, createTurma, getAlunos, createAluno, getProvas } from "@/lib/api";
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
          <TurmaRow key={t.id} turma={t} open={expanded === t.id} onToggle={() => setExpanded(expanded === t.id ? null : t.id)} />
        ))}
      </div>
    </div>
  );
}

function TurmaRow({ turma, open, onToggle }: { turma: Turma; open: boolean; onToggle: () => void }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    if (loaded) return;
    const [a, p] = await Promise.all([
      getAlunos(turma.id).catch(() => [] as Aluno[]),
      getProvas(turma.id).catch(() => [] as Prova[]),
    ]);
    setAlunos(a);
    setProvas(p);
    setLoaded(true);
  }

  function handleToggle() {
    if (!open) load();
    onToggle();
  }

  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <span className="font-semibold text-gray-900">{turma.nome}</span>
          <span className="text-gray-400 mx-2">—</span>
          <span className="text-gray-600">{turma.escola}</span>
          {turma.disciplina && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{turma.disciplina}</span>}
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Alunos {alunos.length > 0 && <span className="text-blue-600">({alunos.length})</span>}
              </p>
              {alunos.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum aluno cadastrado.</p>
              ) : (
                <div className="space-y-1">
                  {alunos.map(a => (
                    <div key={a.id} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {a.nome}
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
                    <div key={p.id} className="text-sm text-gray-700">
                      📄 {p.arquivo_nome} — {p.serie} — {p.total_questoes}q — {p.criado_em.slice(0, 10)}
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
