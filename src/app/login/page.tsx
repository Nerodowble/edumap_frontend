"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight } from "lucide-react";
import { login as apiLogin, getMe } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await apiLogin({ email, senha });
      setToken(res.token);
      const me = await getMe();
      setUser({ nome: me.nome, email: me.email, role: me.role as AuthUser["role"], escola: me.escola });
      router.replace("/");
    } catch {
      setErr("Email ou senha incorretos.");
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
            <h1 className="font-bold text-gray-900 text-2xl">EduMap</h1>
            <p className="text-sm text-gray-500">Acesso do professor</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Não tem conta?{" "}
            <a href="/register" className="text-blue-600 underline">Criar conta</a>
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
                Entrar para responder uma prova
              </div>
            </div>
            <ArrowRight size={20} className="text-emerald-700 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
