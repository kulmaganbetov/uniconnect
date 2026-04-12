import { FormEvent, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiPost } from "../api/axios";
import { useToast } from "../components/Toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string;
}

const SUGGESTIONS = [
  "How do I open a bank account in Almaty as a Narxoz student?",
  "What documents do I need to apply for a Narxoz dormitory?",
  "Where can I find part-time jobs near Narxoz campus?",
  "How does medical insurance work for international students?",
];

export default function AIChat() {
  const toast = useToast();
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

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              AI consultant
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Ask anything about studying in Kazakhstan
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Powered by AI. Get instant, friendly answers about visas,
              housing, jobs, healthcare, language and daily life at Narxoz.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card overflow-hidden flex flex-col h-[70vh]">
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-white"
              >
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex animate-fade-up ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        m.role === "user"
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-gray-100 text-text-dark rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
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
                <div className="border-t border-gray-100 bg-bg-light px-6 py-4">
                  <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
                    Try asking
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        disabled={sending}
                        className="text-xs bg-white border border-gray-200 hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-gray-100 bg-white p-4 flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI consultant..."
                  className="input-field flex-1"
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>

            <p className="text-xs text-muted mt-3 text-center">
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
