"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastType = "ok" | "err" | "warn";

interface Toast {
  id: number;
  type: ToastType;
  text: string;
}

interface ToastContextValue {
  show: (type: ToastType, text: string) => void;
  ok: (text: string) => void;
  err: (text: string) => void;
  warn: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback que não quebra se renderizado fora do provider (testes/SSR)
    return {
      show: () => {},
      ok: () => {},
      err: () => {},
      warn: () => {},
    };
  }
  return ctx;
}

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  ok:   { bg: "bg-emerald-50",  border: "border-emerald-300", icon: "✓", iconColor: "text-emerald-700" },
  err:  { bg: "bg-rose-50",     border: "border-rose-300",    icon: "✗", iconColor: "text-rose-700" },
  warn: { bg: "bg-amber-50",    border: "border-amber-300",   icon: "⚠", iconColor: "text-amber-700" },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: ToastType, text: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const ok   = useCallback((text: string) => show("ok",   text), [show]);
  const err  = useCallback((text: string) => show("err",  text), [show]);
  const warn = useCallback((text: string) => show("warn", text), [show]);

  const value: ToastContextValue = { show, ok, err, warn };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container das notificações — canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map(t => {
          const s = TYPE_STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg ${s.bg} ${s.border} animate-slide-in`}
              role={t.type === "err" ? "alert" : "status"}
            >
              <span className={`text-lg leading-none font-bold ${s.iconColor} mt-0.5`}>{s.icon}</span>
              <span className="text-sm text-slate-800 flex-1">{t.text}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none -mr-1 -mt-1 flex-shrink-0"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
