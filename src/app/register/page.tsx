"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { register as apiRegister, getMe, validarConvite, errMsg } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { ConviteValidacao } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [convite, setConvite] = useState<ConviteValidacao | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [escola, setEscola] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Link de convite: /register?convite=EDU-XXXX-XXXX
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("convite");
    if (c) {
      setCodigo(c.toUpperCase());
      checarConvite(c);
    }
  }, []);

  async function checarConvite(c: string) {
    if (!c.trim()) { setConvite(null); return; }
    try {
      setConvite(await validarConvite(c));
    } catch {
      setConvite(null);
    }
  }

  const escolaDoConvite = convite?.valido ? convite.escola : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (senha.length < 6) { setErr("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await apiRegister({
        nome, email, senha, escola: escolaDoConvite || escola, codigo_convite: codigo,
      });
      setToken(res.token);
      const me = await getMe();
      setUser({ nome: me.nome, email: me.email, role: me.role as AuthUser["role"], escola: me.escola });
      router.replace("/");
    } catch (e: unknown) {
      setErr(errMsg(e, "Não foi possível criar a conta. Tente novamente em instantes."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="card">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="EduMap" width={96} height={96} className="mb-2" />
          <h1 className="font-bold text-gray-900 text-2xl">Criar conta</h1>
          <p className="text-sm text-gray-500 text-center">
            O cadastro de professores é feito por convite.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-convite" className="label">Código de convite</label>
            <input
              id="reg-convite"
              className="input font-mono tracking-wider uppercase"
              placeholder="EDU-XXXX-XXXX"
              value={codigo}
              onChange={e => { setCodigo(e.target.value.toUpperCase()); setConvite(null); }}
              onBlur={e => checarConvite(e.target.value)}
              autoComplete="off"
            />
            {convite?.valido && (
              <p className="flex items-center gap-1 text-xs text-emerald-700 mt-1">
                <CheckCircle2 size={14} />
                Convite válido
                {convite.escola ? ` — ${convite.escola}` : ""}
                {convite.role === "admin_escolar" ? " (administrador escolar)" : ""}
              </p>
            )}
            {convite && !convite.valido && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <XCircle size={14} />
                Convite inválido, expirado ou já utilizado.
              </p>
            )}
            {!convite && (
              <p className="text-xs text-gray-400 mt-1">
                Peça o código ao administrador da sua escola.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="reg-nome" className="label">Nome completo</label>
            <input
              id="reg-nome"
              className="input"
              placeholder="Ex: Maria Souza"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="label">E-mail</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-senha" className="label">Senha</label>
            <input
              id="reg-senha"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          {escolaDoConvite ? (
            <div>
              <span className="label">Escola</span>
              <p className="input bg-gray-50 text-gray-600">{escolaDoConvite}</p>
            </div>
          ) : (
            <div>
              <label htmlFor="reg-escola" className="label">
                Escola <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                id="reg-escola"
                className="input"
                placeholder="Ex: E.E. João da Silva"
                value={escola}
                onChange={e => setEscola(e.target.value)}
              />
            </div>
          )}
          {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem conta?{" "}
          <a href="/login" className="text-blue-600 underline inline-block py-2">Entrar</a>
        </p>
        </div>

        {/* Card secundário: acesso do aluno */}
        <Link
          href="/aluno"
          className="block bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-2xl p-4 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <GraduationCap size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-emerald-900">Sou aluno</div>
              <div className="text-xs text-emerald-700">
                Alunos não precisam criar conta — entrar com Nome e R.A.
              </div>
            </div>
            <ArrowRight size={20} className="text-emerald-700 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
