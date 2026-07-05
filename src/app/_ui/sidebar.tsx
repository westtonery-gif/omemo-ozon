"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConversations } from "./conversations";

const NAV_ITEMS = [
  { label: "Чат", icon: "💬", href: "/" },
  { label: "Товары", icon: "📦", href: "/products" },
  { label: "Продажи", icon: "📈", href: "/sales" },
  { label: "Финансы", icon: "💰", href: "/finance" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sortedConversations, currentId, newChat, selectChat, deleteChat } =
    useConversations();

  function handleNewChat() {
    newChat();
    router.push("/");
  }

  function handleSelect(id: string) {
    selectChat(id);
    router.push("/");
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-zinc-900 text-zinc-100">
      <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
        <span className="text-xl">🟦</span> Ozonologist
      </div>

      <div className="px-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800"
        >
          <span className="text-base">＋</span> Новый чат
        </button>
      </div>

      {/* Навигация по разделам */}
      <nav className="mt-4 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* История чатов */}
      <div className="mt-4 px-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        История
      </div>
      <div className="mt-1 flex-1 overflow-y-auto px-3">
        {sortedConversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              c.id === currentId && pathname === "/"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/60"
            }`}
          >
            <button
              onClick={() => handleSelect(c.id)}
              className="flex-1 truncate text-left"
              title={c.title}
            >
              {c.messages.length === 0 ? "Новый чат" : c.title}
            </button>
            <button
              onClick={() => deleteChat(c.id)}
              aria-label="Удалить чат"
              className="shrink-0 text-zinc-500 opacity-0 transition-opacity hover:text-zinc-200 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 py-4 text-xs text-zinc-500">
        AI-ассистент для продавцов Ozon
      </div>
    </aside>
  );
}
