"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, RefreshCw, Power, Unlock } from "lucide-react";
import { getMonitorProva, encerrarProva, liberarReloginAluno } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { MonitorProvaResp, AlunoAcesso } from "@/lib/types";

function statusLabel(s: AlunoAcesso["status"]) {
  switch (s) {
    case "aguardando": return { txt: "Aguardando", cor: "bg-gray-100 text-gray-700", ponto: "bg-gray-400" };
    case "em_andamento": return { txt: "Em andamento", cor: "bg-blue-50 text-blue-700", ponto: "bg-blue-500 animate-pulse" };
    case "finalizado": return { txt: "Finalizado", cor: "bg-emerald-50 text-emerald-700", ponto: "bg-emerald-500" };
    case "aguardando_relogin": return { txt: "Aguardando relogin", cor: "bg-amber-50 text-amber-700", ponto: "bg-amber-500" };
  }
}

function tempo(start: string | null | undefined, end: string | null | undefined) {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const seg = Math.max(0, Math.floor((e - s) / 1000));
  const m = Math.floor(seg / 60);
  const r = seg % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function AplicarProvaPage() {
  const params = useParams<{ id: string }>();
  const provaId = Number(params.id);
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<MonitorProvaResp | null>(null);
  const [erro, setErro] = useState("");
  const [, setTick] = useState(0); // força re-render do timer
  const liberandoRef = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const d = await getMonitorProva(provaId);
      setData(d);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    }
  }, [provaId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Polling a cada 5s para o monitor + tick local de timer a cada 1s
  useEffect(() => {
    const poll = setInterval(refresh, 5000);
    const tick = setInterval(() => setTick(x => x + 1), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [refresh]);

  async function handleCopiarPin() {
    if (!data?.prova.pin) return;
    try {
      await navigator.clipboard.writeText(data.prova.pin);
      toast.ok("PIN copiado");
    } catch { /* ignore */ }
  }

  async function handleEncerrar() {
    if (!confirm("Encerrar a aplicação? Alunos que não enviaram ainda não conseguirão mais responder.")) return;
    try {
      await encerrarProva(provaId);
      toast.ok("Prova encerrada");
      refresh();
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleLiberar(alunoId: number, nome: string) {
    if (liberandoRef.current.has(alunoId)) return;
    if (!confirm(`Liberar relogin de ${nome}?`)) return;
    liberandoRef.current.add(alunoId);
    try {
      await liberarReloginAluno(provaId, alunoId);
      toast.ok(`Relogin liberado para ${nome.split(" ")[0]}`);
      refresh();
    } catch (err) {
      toast.err(err instanceof Error ? err.message : "Erro");
    } finally {
      liberandoRef.current.delete(alunoId);
    }
  }

  if (erro && !data) {
    return (
      <div>
        <button onClick={() => router.push("/turmas")} className="text-blue-700 text-sm hover:underline mb-3 flex items-center gap-1">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{erro}</div>
      </div>
    );
  }

  if (!data) return <div className="text-gray-500">Carregando…</div>;

  const total = data.acessos.length;
  const enAndamento = data.acessos.filter(a => a.status === "em_andamento").length;
  const finalizados = data.acessos.filter(a => a.status === "finalizado").length;
  const aguardando = data.acessos.filter(a => a.status === "aguardando").length;
  const aguardRelogin = data.acessos.filter(a => a.status === "aguardando_relogin").length;
  const encerrada = data.prova.status === "encerrada";

  return (
    <div>
      <button onClick={() => router.push("/turmas")} className="text-blue-700 text-sm hover:underline mb-3 flex items-center gap-1">
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{data.prova.titulo}</h1>
      <p className="text-gray-500 mb-5 text-sm">
        {data.prova.total_questoes} questões · {total} aluno{total !== 1 ? "s" : ""} na turma
      </p>

      {/* PIN gigante */}
      {!encerrada && data.prova.pin && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-5 mb-5 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs uppercase tracking-wider text-blue-700 font-bold mb-1">PIN para entrar na prova</div>
            <div className="text-4xl sm:text-5xl font-mono font-bold text-blue-700 tabular-nums tracking-[0.2em]">{data.prova.pin}</div>
            <div className="text-xs text-blue-700/80 mt-1">Alunos acessam <strong>/aluno</strong> no celular</div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={handleCopiarPin} className="bg-white border border-blue-300 text-blue-700 font-semibold px-3 py-2 rounded-lg hover:bg-blue-50 text-sm flex items-center gap-1.5">
              <Copy size={14} /> Copiar PIN
            </button>
            <button onClick={handleEncerrar} className="bg-white border border-red-300 text-red-700 font-semibold px-3 py-2 rounded-lg hover:bg-red-50 text-sm flex items-center gap-1.5">
              <Power size={14} /> Encerrar
            </button>
          </div>
        </div>
      )}

      {encerrada && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 mb-5 text-sm text-gray-700">
          Aplicação encerrada. Os alunos não podem mais responder.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <div className="text-xs text-gray-500">Aguardando</div>
          <div className="text-2xl font-bold text-gray-700">{aguardando}</div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-3">
          <div className="text-xs text-blue-700">Em andamento</div>
          <div className="text-2xl font-bold text-blue-700">{enAndamento}</div>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-3">
          <div className="text-xs text-emerald-700">Finalizados</div>
          <div className="text-2xl font-bold text-emerald-700">{finalizados}</div>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-3">
          <div className="text-xs text-amber-700">Aguardando relogin</div>
          <div className="text-2xl font-bold text-amber-700">{aguardRelogin}</div>
        </div>
      </div>

      {/* Tabela de alunos */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Alunos</h2>
          <button onClick={refresh} className="text-blue-700 text-sm hover:underline flex items-center gap-1">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {data.acessos.length === 0 ? (
          <div className="text-gray-500 text-sm py-6 text-center">
            Nenhum aluno cadastrado nessa turma. Cadastre alunos antes de aplicar.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.acessos.map(a => {
              const s = statusLabel(a.status);
              const isFinalizado = a.status === "finalizado";
              const isEmAndamento = a.status === "em_andamento";
              const isAguardandoRelogin = a.status === "aguardando_relogin";
              return (
                <li key={a.aluno_id} className="py-3 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.ponto}`} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{a.aluno_nome}</div>
                    <div className="text-xs text-gray-500">
                      RA {a.ra || "—"}
                      {(isEmAndamento || isFinalizado) && (
                        <span className="ml-2">· tempo {tempo(a.started_at, a.finished_at)}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cor}`}>
                    {s.txt}
                  </span>
                  {(isEmAndamento || isAguardandoRelogin) && !encerrada && (
                    <button
                      onClick={() => handleLiberar(a.aluno_id, a.aluno_nome)}
                      className="text-amber-700 text-xs hover:underline flex items-center gap-1"
                      title="Permite que o aluno entre de outro dispositivo (ex: celular travou)"
                    >
                      <Unlock size={12} /> Liberar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
