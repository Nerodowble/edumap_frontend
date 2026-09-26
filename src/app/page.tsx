"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Upload, ClipboardList, BarChart2, Pencil, ArrowRight, PlusCircle, Smartphone,
  type LucideIcon,
} from "lucide-react";
import { getTurmas } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { Turma } from "@/lib/types";

interface Passo {
  href: string;
  Icon: LucideIcon;
  label: string;
  desc: string;
}

interface Caminho {
  titulo: string;
  resumo: string;
  cor: { bg: string; border: string; text: string };
  passos: Passo[];
}

// Os dois jeitos de usar o EduMap. Ambos começam pela turma e terminam no relatório.
const CAMINHOS: Caminho[] = [
  {
    titulo: "Prova online",
    resumo: "Os alunos respondem no celular. A correção é automática.",
    cor: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
    passos: [
      { href: "/turmas",      Icon: Users,      label: "Cadastre a turma", desc: "Turma e alunos com R.A." },
      { href: "/criar-prova", Icon: PlusCircle, label: "Crie a prova",     desc: "Questão por questão, com gabarito." },
      { href: "/provas",      Icon: Smartphone, label: "Aplique com PIN",  desc: "Acompanhe quem já entrou e terminou." },
      { href: "/relatorio",   Icon: BarChart2,  label: "Veja o relatório", desc: "Onde cada aluno tem dificuldade." },
    ],
  },
  {
    titulo: "Prova impressa",
    resumo: "Envie a foto ou o PDF da prova em papel e lance as respostas.",
    cor: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800" },
    passos: [
      { href: "/turmas",    Icon: Users,         label: "Cadastre a turma",  desc: "Turma e alunos." },
      { href: "/analisar",  Icon: Upload,        label: "Envie a prova",     desc: "O sistema lê e classifica as questões." },
      { href: "/lancar",    Icon: ClipboardList, label: "Lance as respostas", desc: "O que cada aluno marcou." },
      { href: "/relatorio", Icon: BarChart2,     label: "Veja o relatório",  desc: "Diagnóstico da turma e de cada aluno." },
    ],
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

      {/* Os dois caminhos */}
      <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Como você quer aplicar a prova?</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {CAMINHOS.map(({ titulo, resumo, cor, passos }) => (
          <section key={titulo} className={`${cor.bg} ${cor.border} border rounded-xl p-5`}>
            <h3 className={`font-bold text-lg ${cor.text}`}>{titulo}</h3>
            <p className="text-sm text-gray-700 mb-4">{resumo}</p>
            <ol className="space-y-2">
              {passos.map(({ href, Icon, label, desc }, i) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 bg-white/80 hover:bg-white rounded-lg px-3 py-2.5 border border-white hover:shadow-sm transition-all group"
                  >
                    <span className={`w-7 h-7 shrink-0 rounded-full bg-white border ${cor.border} ${cor.text} font-bold text-sm flex items-center justify-center`}>
                      {i + 1}
                    </span>
                    <Icon size={18} className={`${cor.text} shrink-0`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{label}</span>
                      <span className="block text-xs text-gray-600">{desc}</span>
                    </span>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-700 shrink-0" />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mb-10 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-sm text-amber-900">
        <strong>Importante:</strong> vincule sempre a prova à <strong>turma</strong> certa. Sem isso,
        os relatórios individuais dos alunos não são gerados.
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
