"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, ROLE_LABEL } from "@/lib/auth";
import {
  adminListUsuarios, adminListEscolas,
  adminGetTaxonomiaStats, adminGetTaxonomiaNos,
  adminSeedTaxonomia, adminImportTaxonomiaJson,
} from "@/lib/api";
import type {
  UsuarioAdmin, EscolaAgg, TaxonomiaStats, TaxonomiaNoFlat,
} from "@/lib/types";

type Tab = "usuarios" | "escolas" | "taxonomia";

export default function AdminPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("usuarios");

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "admin_geral") {
      router.replace("/");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">⚙️ Administração</h1>
      <p className="text-gray-500 mb-5">Área restrita ao administrador geral.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          ["usuarios",  "👥 Usuários"],
          ["escolas",   "🏫 Escolas"],
          ["taxonomia", "🗺️ Taxonomia"],
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

      {tab === "usuarios" && <UsuariosPanel />}
      {tab === "escolas" && <EscolasPanel />}
      {tab === "taxonomia" && <TaxonomiaPanel />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListUsuarios()
      .then(setUsuarios)
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Carregando…</p>;
  if (usuarios.length === 0) return <p className="text-gray-500">Nenhum usuário cadastrado.</p>;

  const roleBadge: Record<string, string> = {
    admin_geral:   "bg-red-50 text-red-700 border-red-200",
    admin_escolar: "bg-amber-50 text-amber-700 border-amber-200",
    professor:     "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="text-left px-4 py-3">Nome</th>
            <th className="text-left px-4 py-3">E-mail</th>
            <th className="text-left px-4 py-3">Role</th>
            <th className="text-left px-4 py-3">Escola</th>
            <th className="text-left px-4 py-3">Criado em</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {usuarios.map(u => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
              <td className="px-4 py-3 text-gray-600">{u.email}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${roleBadge[u.role] ?? ""}`}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{u.escola || "—"}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {u.criado_em ? String(u.criado_em).slice(0, 10) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function EscolasPanel() {
  const [escolas, setEscolas] = useState<EscolaAgg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListEscolas()
      .then(setEscolas)
      .catch(() => setEscolas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Carregando…</p>;
  if (escolas.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-500">
        Nenhuma escola cadastrada ainda. Elas são agregadas automaticamente a partir
        do campo "escola" em usuários e turmas.
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="text-left px-4 py-3">Escola</th>
            <th className="text-right px-4 py-3">Usuários</th>
            <th className="text-right px-4 py-3">Turmas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {escolas.map(e => (
            <tr key={e.escola} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">🏫 {e.escola}</td>
              <td className="px-4 py-3 text-right tabular-nums">{e.usuarios}</td>
              <td className="px-4 py-3 text-right tabular-nums">{e.turmas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function TaxonomiaPanel() {
  const [stats, setStats] = useState<TaxonomiaStats | null>(null);
  const [materia, setMateria] = useState<string>("");
  const [nos, setNos] = useState<TaxonomiaNoFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const s = await adminGetTaxonomiaStats();
      setStats(s);
      if (s.por_materia.length > 0 && !materia) {
        setMateria(s.por_materia[0].materia);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!materia) return;
    adminGetTaxonomiaNos(materia).then(setNos).catch(() => setNos([]));
  }, [materia]);

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleReSeed() {
    try {
      const r = await adminSeedTaxonomia();
      flash("ok", `Seed OK — ${r.total_depois} nós (adicionados ${r.adicionados}, atualizados ${r.atualizados}).`);
      await refresh();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Erro no seed.");
    }
  }

  async function handleUploadJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const r = await adminImportTaxonomiaJson(data);
      flash("ok", `Upload OK — ${r.total_depois} nós (adicionados ${r.adicionados}, atualizados ${r.atualizados}).`);
      await refresh();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Erro ao importar JSON.");
    } finally {
      e.target.value = "";
    }
  }

  // Monta a árvore a partir da lista flat (parent_id)
  const tree = buildTree(nos);

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === "ok"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {msg.type === "ok" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total_nos}</div>
            <div className="text-xs text-gray-500 mt-1">Total de nós ({stats.etapa})</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.por_materia.length}</div>
            <div className="text-xs text-gray-500 mt-1">Matérias</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.por_nivel.length}</div>
            <div className="text-xs text-gray-500 mt-1">Níveis de profundidade</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.max(0, ...stats.por_nivel.map(n => n.nivel))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Nível máximo</div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">🔧 Ações</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleReSeed} className="btn-primary">
            🔄 Re-executar seed (do JSON do servidor)
          </button>
          <label className="btn-primary cursor-pointer">
            📤 Upload de novo JSON
            <input type="file" accept="application/json" className="hidden" onChange={handleUploadJson} />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          O <strong>upload</strong> substitui/atualiza os nós existentes (UPSERT) a partir do JSON enviado.
          Nós não listados no JSON permanecem no banco (não são apagados).
        </p>
      </div>

      {/* Selector de matéria */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <label className="label mb-0">Matéria</label>
          <select className="input max-w-xs" value={materia} onChange={e => setMateria(e.target.value)}>
            {stats?.por_materia.map(m => (
              <option key={m.materia} value={m.materia}>{m.materia} ({m.total})</option>
            ))}
          </select>
        </div>
        {loading && <p className="text-gray-400 text-sm">Carregando…</p>}
        {!loading && tree.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhum nó para esta matéria.</p>
        )}
        {!loading && tree.length > 0 && (
          <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
            {tree.map(root => <NoTreeRow key={root.id} no={root} depth={0} defaultOpen={true} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface NoComFilhos extends TaxonomiaNoFlat {
  filhos: NoComFilhos[];
}

function buildTree(flat: TaxonomiaNoFlat[]): NoComFilhos[] {
  const byId = new Map<number, NoComFilhos>();
  flat.forEach(n => byId.set(n.id, { ...n, filhos: [] }));
  const roots: NoComFilhos[] = [];
  byId.forEach(n => {
    if (n.parent_id && byId.has(n.parent_id)) {
      byId.get(n.parent_id)!.filhos.push(n);
    } else {
      roots.push(n);
    }
  });
  return roots;
}

function NoTreeRow({ no, depth, defaultOpen }: { no: NoComFilhos; depth: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = no.filhos.length > 0;
  const indent = depth * 16;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 text-sm ${hasChildren ? "cursor-pointer hover:bg-gray-50" : ""}`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <span className="text-gray-400 text-xs w-3 flex-shrink-0">
          {hasChildren ? (open ? "▼" : "▶") : ""}
        </span>
        <span className={`flex-1 truncate ${depth === 0 ? "font-bold text-gray-900" : "text-gray-700"}`}>
          {no.label}
        </span>
        {no.palavras_chave && (
          <span className="text-xs text-gray-400 italic truncate max-w-[40%]" title={no.palavras_chave}>
            {no.palavras_chave}
          </span>
        )}
        <span className="text-xs text-gray-400 tabular-nums">nv {no.nivel}</span>
      </div>
      {open && hasChildren && (
        <div>
          {no.filhos.map(f => (
            <NoTreeRow key={f.id} no={f} depth={depth + 1} defaultOpen={depth < 1} />
          ))}
        </div>
      )}
    </div>
  );
}
