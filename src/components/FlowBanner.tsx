"use client";

import Link from "next/link";

const STEPS = [
  { n: 1 as const, href: "/turmas",    label: "Turmas e Alunos", desc: "Cadastro da turma"    },
  { n: 2 as const, href: "/analisar",  label: "Analisar Prova",  desc: "Upload + OCR + Bloom" },
  { n: 3 as const, href: "/lancar",    label: "Lançamento",      desc: "Respostas dos alunos" },
  { n: 4 as const, href: "/relatorio", label: "Relatório",       desc: "Diagnóstico da turma" },
];

export default function FlowBanner({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Fluxo de uso — EduMap
      </p>
      <div className="flex items-start flex-wrap gap-1.5">
        {STEPS.map((s, i) => {
          const isCurrent = s.n === step;
          const isDone    = s.n < step;
          return (
            <div key={s.n} className="flex items-center gap-1.5">
              <Link
                href={s.href}
                className={`flex flex-col items-center text-center px-3 py-2 rounded-lg transition-colors min-w-[96px] ${
                  isCurrent ? "bg-blue-600 text-white shadow-sm" :
                  isDone    ? "bg-green-50 text-green-700 hover:bg-green-100" :
                              "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  isCurrent ? "bg-white/25 text-white" :
                  isDone    ? "bg-green-200 text-green-800" :
                              "bg-gray-200 text-gray-600"
                }`}>
                  {isDone ? "✓" : s.n}
                </span>
                <span className="text-xs font-semibold leading-tight">{s.label}</span>
                <span className={`text-xs mt-0.5 leading-tight ${isCurrent ? "text-blue-100" : "text-gray-400"}`}>
                  {s.desc}
                </span>
              </Link>
              {i < STEPS.length - 1 && (
                <span className="text-gray-300 text-base select-none hidden sm:block">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
