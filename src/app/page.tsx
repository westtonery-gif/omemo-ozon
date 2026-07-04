"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

const NAV_ITEMS = [
  { label: "История", icon: "🕘" },
  { label: "Товары", icon: "📦" },
  { label: "Продажи", icon: "📈" },
  { label: "Финансы", icon: "💰" },
  { label: "Настройки", icon: "⚙️" },
];

const SUGGESTIONS = [
  "Покажи мои товары в магазине",
  "Как улучшить карточку товара?",
  "Проанализируй продажи за неделю",
  "Почему упала конверсия?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Ошибка запроса");
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.response ?? "" },
      ]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "⚠️ Не удалось получить ответ. Проверьте OPENAI_API_KEY в `.env.local` и попробуйте снова.",
        },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-1 h-screen bg-white text-zinc-900">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-zinc-900 text-zinc-100">
        <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
          <span className="text-xl">🟦</span> Ozonologist
        </div>

        <div className="px-3">
          <button
            onClick={() => setMessages([])}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800"
          >
            <span className="text-base">＋</span> Новый чат
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 py-4 text-xs text-zinc-500">
          AI-ассистент для продавцов Ozon
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-2 text-4xl">🟦</div>
              <h1 className="mb-2 text-2xl font-semibold">
                Чем помочь с магазином на Ozon?
              </h1>
              <p className="mb-8 text-sm text-zinc-500">
                Задайте вопрос — я проанализирую данные и предложу решение.
              </p>
              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <Avatar role="assistant" />
                  <div className="flex items-center gap-1 pt-2 text-zinc-400">
                    <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-200 bg-white px-4 py-4">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-300 bg-white px-3 py-2 shadow-sm focus-within:border-zinc-400"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Спросите Ozonologist..."
              className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-opacity disabled:opacity-30"
              aria-label="Отправить"
            >
              ↑
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-zinc-400">
            Ozonologist может ошибаться. Проверяйте важные данные.
          </p>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={message.role} />
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-900"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose-chat">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: Role }) {
  const isUser = role === "user";
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
        isUser ? "bg-zinc-200" : "bg-blue-600 text-white"
      }`}
    >
      {isUser ? "🧑" : "🟦"}
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
      style={{ animationDelay: delay }}
    />
  );
}
