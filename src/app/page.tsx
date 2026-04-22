"use client";

import { useState, useEffect } from "react";
import { getTurmas } from "@/lib/api";
import Link from "next/link";
import type { Turma } from "@/lib/types";

const QUICK = [
  { href: "/turmas",    icon: "👥", label: "1. Criar turma",      desc: "Cadastre alunos por turma",        bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
  { href: "/analisar",  icon: "📤", label: "2. Analisar prova",   desc: "Upload + OCR + classificação Bloom", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { href: "/lancar",    icon: "📝", label: "3. Lançar respostas", desc: "Registre o que cada aluno respondeu", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  { href: "/relatorio", icon: "📊", label: "4. Ver relatório",    desc: "Diagnóstico completo da turma",    bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
];

export default function HomePage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTurmas()
      .then(t => setTurmas(t))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">EduMap</h1>
        <p className="text-gray-500">Diagnóstico taxonômico de aprendizagem</p>
      </div>

      {/* Ações rápidas */}
      <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Por onde começar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {QUICK.map(({ href, icon, label, desc, bg, border, text }) => (
          <Link
            key={href}
            href={href}
            className={`${bg} ${border} border rounded-xl p-5 hover:shadow-md transition-all flex flex-col gap-2 group`}
          >
            <span className="text-3xl">{icon}</span>
            <span className={`font-semibold ${text} text-sm`}>{label}</span>
            <span className="text-xs text-gray-500 leading-snug">{desc}</span>
          </Link>
        ))}
      </div>

      {/* Turmas */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Suas turmas</h2>
        <Link href="/turmas" className="text-xs text-blue-600 hover:underline">Gerenciar →</Link>
      </div>

      {loading && <p className="text-gray-400 text-sm">Carregando…</p>}

      {!loading && turmas.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">👋</div>
          <p className="font-medium text-gray-700 mb-1">Nenhuma turma cadastrada</p>
          <p className="text-sm text-gray-400 mb-4">Comece criando sua primeira turma para organizar seus alunos.</p>
          <Link href="/turmas" className="btn-primary text-sm px-5 py-2 inline-block">
            Criar primeira turma →
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {turmas.map(t => (
          <div key={t.id} className="card flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">{t.nome}</span>
              {t.escola && <span className="text-gray-400 text-sm ml-2">— {t.escola}</span>}
              {t.disciplina && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{t.disciplina}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/lancar`} className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-300 transition-colors">
                📝 Lançar
              </Link>
              <Link href={`/relatorio`} className="text-xs text-gray-500 hover:text-green-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-green-300 transition-colors">
                📊 Relatório
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && turmas.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          💡 <strong>Dica:</strong> Após analisar uma prova, lembre de <strong>vincular à turma</strong> no formulário de upload para que os relatórios individuais funcionem corretamente.
        </div>
      )}
    </div>
  );
}
