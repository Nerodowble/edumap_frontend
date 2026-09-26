"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Pencil, Play, BarChart2, ArrowRight } from "lucide-react";
import { getProvasOnline, errMsg } from "@/lib/api";
import type { ProvaOnline, ProvaStatus } from "@/lib/types";

const STATUS: Record<ProvaStatus, { label: string; cls: string; dica: string }> = {
  rascunho:  { label: "Rascunho",  cls: "bg-amber-50 text-amber-800 border-amber-300",
               dica: "Ainda não foi aplicada. Termine as questões e publique." },
  publicada: { label: "Aberta",    cls: "bg-emerald-50 text-emerald-800 border-emerald-300",
               dica: "Os alunos podem responder agora." },
  encerrada: { label: "Encerrada", cls: "bg-gray-100 text-gray-700 border-gray-300",
               dica: "Aplicação finalizada. Veja o relatório." },
};

function dataBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(String(iso).replace(" ", "T"));
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

export default function ProvasOnlinePage() {
  const [provas, setProvas] = useState<ProvaOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getProvasOnline()
      .then(setProvas)
      .catch(err => setErro(errMsg(err, "Não foi possível carregar suas provas.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Provas online</h1>
          <p className="text-gray-600">
            Provas que os alunos respondem no celular. Crie, aplique com um PIN e acompanhe ao vivo.
          </p>
        </div>
        <Link href="/criar-prova" className="btn-primary inline-flex items-center gap-2">
          <PlusCircle size={18} /> Criar prova
        </Link>
      </div>

      {loading && <p className="text-gray-500">Carregando…</p>}

      {!loading && erro && (
        <div className="card border-red-200 text-red-800" role="alert">{erro}</div>
      )}

      {!loading && !erro && provas.length === 0 && (
        <div className="card text-center py-12">
          <p className="font-medium text-gray-800 mb-1">Você ainda não criou nenhuma prova online.</p>
          <p className="text-sm text-gray-600 mb-4">
            Monte a prova questão por questão; o sistema classifica cada uma automaticamente.
          </p>
          <Link href="/criar-prova" className="btn-primary inline-flex items-center gap-2">
            Criar minha primeira prova <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {!loading && !erro && provas.length > 0 && (
        <ul className="space-y-3">
          {provas.map(p => {
            const st = STATUS[p.status] ?? STATUS.rascunho;
            return (
              <li key={p.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900 break-words">{p.titulo}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {[p.turma_nome, p.disciplina,
                        `${p.total_questoes} ${p.total_questoes === 1 ? "questão" : "questões"}`,
                        p.tempo_limite_min ? `${p.tempo_limite_min} min` : null]
                        .filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {st.dica} {dataBR(p.publicada_em || p.criado_em) && `· ${dataBR(p.publicada_em || p.criado_em)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.status === "rascunho" && (
                      <Link href={`/criar-prova?id=${p.id}`} className="btn-primary inline-flex items-center gap-2">
                        <Pencil size={16} /> Continuar editando
                      </Link>
                    )}
                    {(p.status === "publicada" || p.status === "encerrada") && (
                      <Link href={`/aplicar/${p.id}`}
                        className={`${p.status === "publicada" ? "btn-primary" : "btn-secondary"} inline-flex items-center gap-2`}>
                        <Play size={16} /> {p.status === "publicada" ? "Acompanhar ao vivo" : "Ver aplicação"}
                      </Link>
                    )}
                    {p.status !== "rascunho" && (
                      <Link href="/relatorio" className="btn-secondary inline-flex items-center gap-2">
                        <BarChart2 size={16} /> Relatório
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
