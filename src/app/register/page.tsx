"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { register as apiRegister, getMe } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [escola, setEscola] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (senha.length < 6) { setErr("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await apiRegister({ nome, email, senha, escola });
      setToken(res.token);
      const me = await getMe();
      setUser({ nome: me.nome, email: me.email, role: me.role as AuthUser["role"], escola: me.escola });
      router.replace("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setErr(msg.includes("400") ? "Este e-mail já está cadastrado." : "Erro ao criar conta.");
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
          <p className="text-sm text-gray-500">Criar conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input
              className="input"
              placeholder="Ex: Maria Souza"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>
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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Escola <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              className="input"
              placeholder="Ex: E.E. João da Silva"
              value={escola}
              onChange={e => setEscola(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-3">
          O primeiro usuário registrado torna-se administrador geral.
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          Já tem conta?{" "}
          <a href="/login" className="text-blue-600 underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
