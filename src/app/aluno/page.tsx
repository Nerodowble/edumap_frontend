"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { alunoLogin } from "@/lib/api";
import { setAlunoToken, setAlunoSessao, isAlunoAutenticado } from "@/lib/alunoAuth";

export default function AlunoLoginPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // Se já tem sessão de aluno, manda direto pra lista de provas
  useEffect(() => {
    if (isAlunoAutenticado()) router.replace("/aluno/provas");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!nome.trim() || !ra.trim()) {
      setErro("Preencha o nome e o R.A.");
      return;
    }
    setLoading(true);
    try {
      const r = await alunoLogin({ nome: nome.trim(), ra: ra.trim() });
      setAlunoToken(r.token);
      setAlunoSessao(r.aluno);
      router.push("/aluno/provas");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar.";
      // Mensagem amigável para 401
      setErro(msg.includes("401")
        ? "Não encontramos você. Confira o nome completo e o R.A. com seu professor."
        : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <Image src="/logo.png" alt="EduMap" width={32} height={32} />
        <span className="font-bold text-gray-900">EduMap</span>
        <span className="ml-auto text-xs text-gray-500">Área do aluno</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Olá!</h1>
            <p className="text-gray-600 mb-6">
              Vamos começar sua prova. Digite seu nome e R.A. abaixo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nome completo
                </label>
                <input
                  id="nome"
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Como está no diário da turma"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="ra" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  R.A. (Registro Acadêmico)
                </label>
                <input
                  id="ra"
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="O número que a ETEC te deu"
                  value={ra}
                  onChange={e => setRa(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verificando…" : "Entrar"}
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">
                Não consegue entrar? Avise o professor para conferir seu cadastro.
              </p>
            </form>
          </div>

          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-blue-700 underline">
              Sou professor — entrar pela área do professor
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
