"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, logout, ROLE_LABEL } from "@/lib/auth";

const NAV = [
  { href: "/",          label: "Início",                icon: "🏠", exact: true },
  { href: "/turmas",    label: "Turmas e Alunos",       icon: "👥", exact: false },
  { href: "/analisar",  label: "Analisar Prova",        icon: "📤", exact: false },
  { href: "/lancar",    label: "Lançamento",            icon: "📝", exact: false },
  { href: "/relatorio", label: "Relatório do Professor", icon: "📊", exact: false },
];

export default function Sidebar() {
  const path = usePathname();
  const user = getUser();

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="EduMap IA" width={40} height={40} />
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">EduMap IA</h1>
            <p className="text-xs text-gray-500">v0.1 MVP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
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

      {/* User info + logout */}
      {user && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.nome}</p>
              <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium mt-0.5">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          EduMap IA · extensão universitária<br />diagnóstico educacional · código aberto
        </p>
      </div>
    </aside>
  );
}
