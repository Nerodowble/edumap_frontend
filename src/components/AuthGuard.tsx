"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import Sidebar from "./Sidebar";

const PUBLIC_PATHS = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(path)) {
      setReady(true);
      return;
    }
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [path, router]);

  // Fecha sidebar mobile ao navegar
  useEffect(() => { setSidebarOpen(false); }, [path]);

  if (!ready) return null;

  if (PUBLIC_PATHS.includes(path)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {/* Top bar — só aparece em mobile (< md) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="EduMap" width={28} height={28} />
          <span className="font-bold text-gray-900">EduMap</span>
        </div>
        <span className="w-8" />
      </div>

      {/* Overlay mobile quando sidebar aberta */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Conteúdo principal */}
      <main className="md:ml-64 pt-16 md:pt-0 px-4 md:px-8 py-4 md:py-8 md:max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}
