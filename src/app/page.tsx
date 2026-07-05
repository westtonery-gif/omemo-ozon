"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useConversations,
  makeTitle,
  type Message,
  type Role,
} from "./_ui/conversations";

const SUGGESTIONS = [
  "Покажи мои товары в магазине",
  "Как улучшить карточку товара?",
  "Проанализируй продажи за неделю",
  "Почему упала конверсия?",
];

export default function Home() {
  const { currentId, current, updateConversation } = useConversations();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = current?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const id = currentId;
    const conv = current;
    if (!conv) return;

    const nextMessages: Message[] = [
      ...conv.messages,
      { role: "user", content: trimmed },
    ];
    updateConversation(id, {
      messages: nextMessages,
      title: conv.messages.length === 0 ? makeTitle(trimmed) : conv.title,
      updatedAt: Date.now(),
    });
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Шлём всю историю диалога — модель помнит контекст.
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Ошибка запроса");
      }

      // Читаем потоковый ответ и дописываем текст по мере поступления.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let started = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (!started) {
          started = true;
          setLoading(false); // первый токен пришёл — убираем «печатает…»
        }
        updateConversation(id, {
          messages: [...nextMessages, { role: "assistant", content: acc }],
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      updateConversation(id, {
        messages: [
          ...nextMessages,
          {
            role: "assistant",
            content:
              "⚠️ Не удалось получить ответ. Проверьте OPENAI_API_KEY в `.env.local` и попробуйте снова.",
          },
        ],
        updatedAt: Date.now(),
      });
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
    <>
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
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={message.role} />
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
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
