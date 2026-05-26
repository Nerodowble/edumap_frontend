"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { alunoListarProvas, alunoIniciarProva } from "@/lib/api";
import { getAlunoSessao, logoutAluno, isAlunoAutenticado } from "@/lib/alunoAuth";
import type { ProvaEmAberto } from "@/lib/types";

export default function AlunoProvasPage() {
  const router = useRouter();
  const [sessao, setSessao] = useState<{ nome: string; ra: string } | null>(null);
  const [provas, setProvas] = useState<ProvaEmAberto[]>([]);
  const [loading, setLoading] = useState(true);
  const [provaSelecionada, setProvaSelecionada] = useState<ProvaEmAberto | null>(null);
  const [pin, setPin] = useState("");
  const [erroPin, setErroPin] = useState("");
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    if (!isAlunoAutenticado()) {
      router.replace("/aluno");
      return;
    }
    const s = getAlunoSessao();
    if (s) setSessao({ nome: s.nome, ra: s.ra });
    alunoListarProvas()
      .then(setProvas)
      .catch(() => setProvas([]))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleEntrar() {
    if (!provaSelecionada) return;
    setErroPin("");
    if (pin.trim().length < 4) {
      setErroPin("Digite o PIN que o professor mostrou.");
      return;
    }
    setIniciando(true);
    try {
      await alunoIniciarProva(provaSelecionada.id, pin.trim());
      router.push(`/aluno/prova/${provaSelecionada.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar.";
      if (msg.includes("409")) {
        setErroPin("Esta prova já foi iniciada em outro dispositivo. Peça ao professor para liberar relogin.");
      } else if (msg.includes("401")) {
        setErroPin("PIN incorreto. Confira com o professor.");
      } else if (msg.includes("403")) {
        setErroPin("Você já finalizou esta prova ou ela não é da sua turma.");
      } else {
        setErroPin(msg);
      }
    } finally {
      setIniciando(false);
    }
  }

  const provasAbertas = provas.filter(p => !p.finished_at);
  const provasFinalizadas = provas.filter(p => !!p.finished_at);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <Image src="/logo.png" alt="EduMap" width={28} height={28} />
        <span className="font-bold text-gray-900">EduMap</span>
        <div className="ml-auto flex items-center gap-3">
          {sessao && (
            <span className="text-xs text-gray-600 hidden sm:inline">
              {sessao.nome} · RA {sessao.ra}
            </span>
          )}
          <button onClick={logoutAluno} className="text-xs text-gray-500 hover:text-gray-900 underline">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Suas provas</h1>
        <p className="text-gray-600 mb-6 text-sm">
          {sessao ? `Olá, ${sessao.nome.split(" ")[0]}! ` : ""}
          Selecione uma prova em aberto e digite o PIN que o professor mostrou.
        </p>

        {loading && (
          <div className="text-gray-500">Carregando…</div>
        )}

        {!loading && provasAbertas.length === 0 && provasFinalizadas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-medium mb-1">Nenhuma prova em aberto agora.</p>
            <p className="text-gray-500 text-sm">
              Volte aqui quando seu professor publicar uma prova.
            </p>
          </div>
        )}

        {!loading && provasAbertas.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Em aberto</h2>
            <ul className="space-y-3">
              {provasAbertas.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => { setProvaSelecionada(p); setPin(""); setErroPin(""); }}
                    className="w-full text-left bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-4 sm:p-5 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{p.titulo}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {p.disciplina || "—"} {p.serie ? `· ${p.serie}` : ""}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {p.total_questoes} questões
                          {p.tempo_limite_min ? ` · ${p.tempo_limite_min} min` : " · sem tempo limite"}
                          {p.started_at && !p.finished_at ? " · em andamento" : ""}
                        </div>
                      </div>
                      <span className="text-blue-700 font-semibold text-sm group-hover:underline">
                        {p.started_at && !p.finished_at ? "Continuar →" : "Entrar →"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && provasFinalizadas.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Já finalizadas</h2>
            <ul className="space-y-2">
              {provasFinalizadas.map(p => (
                <li key={p.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 opacity-80">
                  <div className="font-medium text-gray-700">{p.titulo}</div>
                  <div className="text-xs text-gray-500">
                    Enviada · {p.disciplina || "—"} · {p.total_questoes} questões
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Modal PIN */}
      {provaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-in">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{provaSelecionada.titulo}</h3>
            <p className="text-sm text-gray-600 mb-4">Digite o PIN que o professor mostrou.</p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="000000"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-4 text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:border-blue-500"
            />

            {erroPin && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {erroPin}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setProvaSelecionada(null)}
                className="flex-1 bg-white text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEntrar}
                disabled={iniciando || pin.length < 4}
                className="flex-1 bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {iniciando ? "Entrando…" : "Entrar na prova"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
