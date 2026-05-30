import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AgentProvider } from "@/providers/AgentProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Operator OS",
  description: "Mission Control for AI Agents",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Operator OS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} overflow-hidden h-[100dvh] w-screen`}>
        <QueryProvider>
          <AgentProvider>{children}</AgentProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
