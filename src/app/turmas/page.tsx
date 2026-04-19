"use client";

import { useState, useEffect } from "react";
import { getTurmas, createTurma, getAlunos, createAluno, getProvas } from "@/lib/api";
import type { Turma, Aluno, Prova } from "@/lib/types";
import FlowBanner from "@/components/FlowBanner";
import InfoBox from "@/components/InfoBox";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [turmaNome, setTurmaNome] = useState("");
  const [turmaEscola, setTurmaEscola] = useState("");
  const [turmaDisc, setTurmaDisc] = useState("");
  const [alunoNome, setAlunoNome] = useState("");
  const [alunoTurmaId, setAlunoTurmaId] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try { setTurmas(await getTurmas()); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleCreateTurma(e: React.FormEvent) {
    e.preventDefault();
    if (!turmaNome.trim()) return;
    try {
      await createTurma({ nome: turmaNome, escola: turmaEscola, disciplina: turmaDisc });
      setTurmaNome(""); setTurmaEscola(""); setTurmaDisc("");
      flash("ok", `Turma "${turmaNome}" criada!`);
      await load();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Erro ao criar turma.");
    }
  }

  async function handleCreateAluno(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoNome.trim() || !alunoTurmaId) return;
    try {
      await createAluno(Number(alunoTurmaId), alunoNome);
      setAlunoNome("");
      flash("ok", `Aluno "${alunoNome}" adicionado!`);
      await load();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Erro ao adicionar aluno.");
    }
  }

  return (
    <div>
      <FlowBanner step={2} />

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

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {msg.type === "ok" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Criar turma */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Criar nova turma</h2>
          <form onSubmit={handleCreateTurma} className="space-y-3">
            <div>
              <label className="label">Nome da turma</label>
              <input className="input" placeholder="Ex: 8º ano B" value={turmaNome} onChange={e => setTurmaNome(e.target.value)} />
            </div>
            <div>
              <label className="label">Escola</label>
              <input className="input" placeholder="Ex: E.E. João da Silva" value={turmaEscola} onChange={e => setTurmaEscola(e.target.value)} />
            </div>
            <div>
              <label className="label">Disciplina principal (opcional)</label>
              <input className="input" placeholder="Ex: Matemática" value={turmaDisc} onChange={e => setTurmaDisc(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full">Criar turma</button>
          </form>
        </div>

        {/* Adicionar aluno */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Adicionar aluno</h2>
          {turmas.length === 0 ? (
            <p className="text-gray-500 text-sm">Crie uma turma primeiro.</p>
          ) : (
            <form onSubmit={handleCreateAluno} className="space-y-3">
              <div>
                <label className="label">Turma</label>
                <select className="input" value={alunoTurmaId} onChange={e => setAlunoTurmaId(e.target.value)}>
                  <option value="">Selecionar turma…</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} — {t.escola}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nome do aluno</label>
                <input className="input" placeholder="Nome completo" value={alunoNome} onChange={e => setAlunoNome(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary w-full">Adicionar aluno</button>
            </form>
          )}
        </div>
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
