import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Assistant OS - Gelişmiş Yapay Zeka Asistanı",
  description: "Next.js 15, Multi-Agent Orkestrasyonu ve Uzun Vadeli Hafıza içeren gelişmiş yapay zeka paneli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased min-h-screen relative bg-background text-foreground">
        {/* Arka Plan Glow Efektleri */}
        <div className="glow-bg glow-purple" />
        <div className="glow-bg glow-blue" />
        
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
