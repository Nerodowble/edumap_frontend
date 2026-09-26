"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Ban } from "lucide-react";
import {
  adminListConvites, adminCriarConvite, adminDesativarConvite, errMsg,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import type { Convite } from "@/lib/types";

const STATUS_STYLE: Record<Convite["status"], string> = {
  ativo:      "bg-emerald-50 text-emerald-800 border-emerald-300",
  expirado:   "bg-gray-100 text-gray-700 border-gray-300",
  esgotado:   "bg-blue-50 text-blue-800 border-blue-300",
  desativado: "bg-rose-50 text-rose-800 border-rose-300",
};

const PERFIL_LABEL: Record<Convite["role"], string> = {
  professor: "Professor",
  admin_escolar: "Admin escolar",
};

function linkConvite(codigo: string) {
  return `${window.location.origin}/register?convite=${codigo}`;
}

function dataBR(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export default function ConvitesPanel() {
  const toast = useToast();
  const user = getUser();
  const ehAdminGeral = user?.role === "admin_geral";

  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState<Convite | null>(null);

  const [role, setRole] = useState<Convite["role"]>("professor");
  const [escola, setEscola] = useState("");
  const [usosMax, setUsosMax] = useState(1);
  const [validade, setValidade] = useState(7);

  async function load() {
    setLoading(true);
    try {
      setConvites(await adminListConvites());
    } catch (e) {
      toast.err(errMsg(e, "Não foi possível carregar os convites."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setCriando(true);
    try {
      const c = await adminCriarConvite({
        role: ehAdminGeral ? role : "professor",
        escola: ehAdminGeral ? escola.trim() : "",
        usos_max: usosMax,
        validade_dias: validade,
      });
      setNovo(c);
      toast.ok(`Convite ${c.codigo} gerado.`);
      await load();
    } catch (e) {
      toast.err(errMsg(e, "Não foi possível gerar o convite."));
    } finally {
      setCriando(false);
    }
  }

  async function handleCopiar(texto: string, oque: string) {
    if (await copiar(texto)) toast.ok(`${oque} copiado.`);
    else toast.warn(`Não foi possível copiar. Selecione e copie manualmente: ${texto}`);
  }

  async function handleDesativar(c: Convite) {
    if (!confirm(`Desativar o convite ${c.codigo}? Ele não poderá mais ser usado para cadastro.`)) return;
    try {
      await adminDesativarConvite(c.id);
      toast.ok(`Convite ${c.codigo} desativado.`);
      if (novo?.id === c.id) setNovo(null);
      await load();
    } catch (e) {
      toast.err(errMsg(e, "Não foi possível desativar o convite."));
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCriar} className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Gerar convite de cadastro</h2>
          <p className="text-sm text-gray-500">
            Só quem tiver o código consegue criar conta.
            {ehAdminGeral
              ? " O perfil e a escola do convite valem para quem se cadastrar com ele."
              : ` O convite cadastra professores da sua escola (${user?.escola}).`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ehAdminGeral && (
            <>
              <div>
                <label htmlFor="conv-role" className="label">Perfil</label>
                <select
                  id="conv-role"
                  className="input"
                  value={role}
                  onChange={e => setRole(e.target.value as Convite["role"])}
                >
                  <option value="professor">Professor</option>
                  <option value="admin_escolar">Admin escolar</option>
                </select>
              </div>
              <div>
                <label htmlFor="conv-escola" className="label">
                  Escola <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="conv-escola"
                  className="input"
                  placeholder="Ex: ETEC Juscelino Kubitschek"
                  value={escola}
                  onChange={e => setEscola(e.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="conv-usos" className="label">Quantas pessoas podem usar</label>
            <input
              id="conv-usos"
              className="input"
              type="number"
              min={1}
              max={500}
              value={usosMax}
              onChange={e => setUsosMax(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
            />
          </div>
          <div>
            <label htmlFor="conv-validade" className="label">Prazo para usar o convite (dias)</label>
            <input
              id="conv-validade"
              className="input"
              type="number"
              min={1}
              max={90}
              value={validade}
              onChange={e => setValidade(Math.max(1, Math.min(90, Number(e.target.value) || 7)))}
            />
          </div>
        </div>

        <button type="submit" disabled={criando} className="btn-primary">
          {criando ? "Gerando…" : "Gerar convite"}
        </button>

        {novo && (
          <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4 space-y-3">
            <p className="text-sm text-emerald-900 font-medium">
              Convite gerado. Envie o link (ou o código) para a pessoa:
            </p>
            <p className="font-mono text-2xl font-bold tracking-wider text-emerald-900 break-all">
              {novo.codigo}
            </p>
            <p className="text-xs text-emerald-800 break-all">{linkConvite(novo.codigo)}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopiar(linkConvite(novo.codigo), "Link")}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Link2 size={16} /> Copiar link
              </button>
              <button
                type="button"
                onClick={() => handleCopiar(novo.codigo, "Código")}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Copy size={16} /> Copiar código
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Convites gerados</h2>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-gray-500">Carregando…</p>
        ) : convites.length === 0 ? (
          <p className="px-4 py-6 text-gray-500">Nenhum convite gerado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Código</th>
                  <th className="text-left px-4 py-3">Perfil</th>
                  <th className="text-left px-4 py-3">Escola</th>
                  <th className="text-left px-4 py-3">Usos</th>
                  <th className="text-left px-4 py-3">Prazo do convite</th>
                  <th className="text-left px-4 py-3">Situação</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {convites.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 whitespace-nowrap">{c.codigo}</td>
                    <td className="px-4 py-3 text-gray-700">{PERFIL_LABEL[c.role] ?? c.role}</td>
                    <td className="px-4 py-3 text-gray-700">{c.escola || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{c.usos} de {c.usos_max}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{dataBR(c.expira_em)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === "ativo" && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleCopiar(linkConvite(c.codigo), "Link")}
                            className="inline-flex items-center gap-1 px-2 py-2 text-blue-700 hover:text-blue-900 hover:underline text-xs"
                          >
                            <Link2 size={14} /> Copiar link
                          </button>
                          <button
                            onClick={() => handleDesativar(c)}
                            className="inline-flex items-center gap-1 px-2 py-2 text-red-700 hover:text-red-900 hover:underline text-xs"
                          >
                            <Ban size={14} /> Desativar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
