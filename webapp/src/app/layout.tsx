import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Water Leakage Detector",
  description: "IoT Dashboard for Smart Water Leakage Detection and Pump Protection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-200 min-h-screen flex selection:bg-cyan-500/30 selection:text-cyan-200`}>
        <ToastProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
            <Header />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
            <MobileNav />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
