import { FormEvent, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiPost } from "../api/axios";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string;
}

const SUGGESTIONS = [
  {
    icon: "🏦",
    label: "How do I open a bank account in Almaty as a Narxoz student?",
  },
  {
    icon: "🏠",
    label: "What documents do I need to apply for a Narxoz dormitory?",
  },
  {
    icon: "💼",
    label: "Where can I find part-time jobs near Narxoz campus?",
  },
  {
    icon: "🏥",
    label: "How does medical insurance work for international students?",
  },
];

function BotAvatar() {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-md ring-2 ring-white">
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
        <circle cx="9" cy="9" r="1" fill="currentColor" />
        <circle cx="15" cy="9" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}

function UserAvatar({ name }: { name?: string }) {
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-navy to-gray-700 flex items-center justify-center shadow-md ring-2 ring-white text-white font-bold text-sm">
      {initial}
    </div>
  );
}

export default function AIChat() {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your UniConnect AI consultant for Narxoz University. Ask me anything about studying and living in Almaty — visas, dormitories, part-time work, healthcare, transport, banking, or daily life. How can I help today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await apiPost<ChatResponse>("/api/ai/chat", {
        messages: next,
      });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg = (err as Error).message || "Failed to reach AI consultant";
      toast.error(msg);
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach the consultant service right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm your UniConnect AI consultant for Narxoz University. Ask me anything about studying and living in Almaty — visas, dormitories, part-time work, healthcare, transport, banking, or daily life. How can I help today?",
      },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        {/* Hero header with AI illustration */}
        <section className="bg-gradient-to-br from-navy via-navy to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
            <div className="flex items-start gap-5">
              <div className="hidden sm:flex flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-red-700 items-center justify-center shadow-xl ring-4 ring-white/10">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                  <circle cx="9" cy="9" r="1.3" fill="currentColor" />
                  <circle cx="15" cy="9" r="1.3" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  AI consultant · Online
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold">
                  Ask anything about studying in Kazakhstan
                </h1>
                <p className="text-gray-300 mt-2 max-w-2xl">
                  Powered by AI. Get instant, friendly answers about visas,
                  housing, jobs, healthcare, language and daily life at Narxoz.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card overflow-hidden flex flex-col h-[72vh] shadow-xl">
              {/* Chat header bar */}
              <div className="border-b border-gray-100 bg-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <BotAvatar />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
                  </div>
                  <div>
                    <div className="font-bold text-navy text-sm">
                      UniConnect AI
                    </div>
                    <div className="text-xs text-muted">
                      Your Narxoz assistant
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetChat}
                  disabled={sending || messages.length <= 1}
                  className="text-xs text-muted hover:text-primary font-semibold disabled:opacity-40 flex items-center gap-1"
                  title="Start a new conversation"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  New chat
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-bg-light to-white"
              >
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-end gap-2.5 animate-fade-up ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && <BotAvatar />}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-primary to-red-700 text-white rounded-br-sm"
                          : "bg-white border border-gray-100 text-text-dark rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.role === "user" && <UserAvatar name={user?.name} />}
                  </div>
                ))}

                {sending && (
                  <div className="flex items-end gap-2.5 justify-start">
                    <BotAvatar />
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" />
                      <span
                        className="w-2 h-2 bg-primary rounded-full animate-pulse-dot"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-2 h-2 bg-primary rounded-full animate-pulse-dot"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {messages.length <= 1 && (
                <div className="border-t border-gray-100 bg-bg-light px-5 py-4">
                  <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-3 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Try asking
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => void send(s.label)}
                        disabled={sending}
                        className="text-left text-xs bg-white border border-gray-200 hover:border-primary hover:bg-primary/5 hover:text-primary px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-start gap-2"
                      >
                        <span className="text-base flex-shrink-0">
                          {s.icon}
                        </span>
                        <span className="leading-snug">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-gray-100 bg-white p-4 flex gap-2 items-center"
              >
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the AI consultant..."
                    className="input-field pl-9"
                    disabled={sending}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="btn-primary disabled:opacity-50 flex items-center gap-1.5"
                  aria-label="Send message"
                >
                  <span className="hidden sm:inline">Send</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </form>
            </div>

            <p className="text-xs text-muted mt-3 text-center flex items-center justify-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Responses are AI-generated and may contain inaccuracies. For
              official guidance, contact your university administration.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
