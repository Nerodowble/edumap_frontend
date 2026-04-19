import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "EduMap IA",
  description: "Diagnóstico taxonômico inteligente de aprendizagem",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 max-w-[1400px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
