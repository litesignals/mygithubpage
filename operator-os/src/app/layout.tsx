import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AgentProvider } from "@/providers/AgentProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Operator OS",
  description: "Mission Control for AI Agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} overflow-hidden h-screen w-screen`}>
        <QueryProvider>
          <AgentProvider>{children}</AgentProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
