import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SISPROM-BR 360º · Inteligência Territorial e Fiscal",
  description:
    "Protótipo funcional do Sistema de Monitoramento do Plano Estadual da Juventude do Paraná — painéis estadual e municipal, indicadores, mapa territorial, transparência e integração entre políticas públicas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
