import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConversationsProvider } from "./_ui/conversations";
import Sidebar from "./_ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ozonologist",
  description: "AI-ассистент для продавцов Ozon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ConversationsProvider>
          <div className="flex h-screen bg-white text-zinc-900">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          </div>
        </ConversationsProvider>
      </body>
    </html>
  );
}
