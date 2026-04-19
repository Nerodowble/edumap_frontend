"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/analisar",  label: "Analisar Prova",       icon: "📤" },
  { href: "/turmas",    label: "Turmas e Alunos",       icon: "👥" },
  { href: "/lancar",    label: "Lançamento",            icon: "📝" },
  { href: "/relatorio", label: "Relatório do Professor", icon: "📊" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">EduMap IA</h1>
            <p className="text-xs text-gray-500">v0.1 MVP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-700 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          100% local · sem IA paga<br />código aberto · extensão universitária
        </p>
      </div>
    </aside>
  );
}
