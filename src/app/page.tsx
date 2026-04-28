"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Upload, ClipboardList, BarChart2, Pencil, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { getTurmas } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { Turma } from "@/lib/types";

interface QuickItem {
  href: string;
  Icon: LucideIcon;
  label: string;
  desc: string;
  bg: string;
  border: string;
  text: string;
}

const QUICK: QuickItem[] = [
  {
    href: "/turmas",
    Icon: Users,
    label: "1. Turmas e Alunos",
    desc: "Cadastre suas turmas e os alunos de cada uma.",
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700",
  },
  {
    href: "/analisar",
    Icon: Upload,
    label: "2. Analisar Prova",
    desc: "Envie a foto ou PDF da prova. O sistema lê e classifica as questões automaticamente.",
    bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700",
  },
  {
    href: "/lancar",
    Icon: ClipboardList,
    label: "3. Lançamento",
    desc: "Registre o que cada aluno respondeu e calcule o desempenho.",
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
  },
  {
    href: "/relatorio",
    Icon: BarChart2,
    label: "4. Relatório",
    desc: "Diagnóstico completo da turma e de cada aluno individualmente.",
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
  },
];

export default function HomePage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const primeiroNome = user?.nome?.split(" ")[0] ?? "";

  useEffect(() => {
    getTurmas()
      .then(t => setTurmas(t))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {primeiroNome ? `Olá, ${primeiroNome}!` : "Bem-vindo ao EduMap"} 👋
        </h1>
        <p className="text-gray-500">
          Sua ferramenta de diagnóstico pedagógico por turma.
        </p>
      </div>

      {/* Ações rápidas */}
      <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Por onde começar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {QUICK.map(({ href, Icon, label, desc, bg, border, text }) => (
          <Link
            key={href}
            href={href}
            className={`${bg} ${border} border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-2 group cursor-pointer`}
          >
            <Icon size={28} className={text} />
            <span className={`font-semibold ${text} text-sm`}>{label}</span>
            <span className="text-xs text-gray-600 leading-snug">{desc}</span>
            <span className={`mt-auto pt-2 text-xs font-medium ${text} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
              Ir para esta etapa <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      {/* Aviso importante (movido pra cima do "Suas turmas") */}
      <div className="mb-10 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg text-sm text-amber-900">
        <strong>⚠️ Importante:</strong> ao enviar uma prova para análise, lembre-se de
        <strong> selecionar a turma correspondente</strong>. Sem essa vinculação, os relatórios
        individuais dos alunos não serão gerados.
      </div>

      {/* Turmas */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Suas turmas</h2>
        <Link href="/turmas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          Gerenciar <ArrowRight size={12} />
        </Link>
      </div>

      {loading && <p className="text-gray-400 text-sm">Carregando…</p>}

      {!loading && turmas.length === 0 && (
        <div className="card text-center py-12">
          <Users size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium text-gray-700 mb-1">Nenhuma turma cadastrada</p>
          <p className="text-sm text-gray-400 mb-4">Comece criando sua primeira turma para organizar seus alunos.</p>
          <Link href="/turmas" className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2">
            Criar primeira turma <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {turmas.map(t => (
          <div key={t.id} className="card flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-semibold text-gray-900">{t.nome}</span>
              {t.escola && <span className="text-gray-400 text-sm ml-2">— {t.escola}</span>}
              {t.disciplina && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{t.disciplina}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href="/lancar"
                title="Registrar respostas dos alunos"
                className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Pencil size={14} /> Lançar
              </Link>
              <Link
                href="/relatorio"
                title="Ver diagnóstico desta turma"
                className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <BarChart2 size={14} /> Relatório
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
