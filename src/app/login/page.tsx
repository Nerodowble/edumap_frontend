"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm card">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="EduMap" width={120} height={120} className="mb-3" />
          <h1 className="font-bold text-gray-900 text-2xl">EduMap</h1>
          <p className="text-sm text-gray-500">Entrar na plataforma</p>
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
    </div>
  );
}
