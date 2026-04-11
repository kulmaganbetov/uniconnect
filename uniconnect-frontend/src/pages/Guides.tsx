import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiGet } from "../api/axios";

interface Guide {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

const categories = [
  { key: "", label: "All", icon: "📚" },
  { key: "transport", label: "Transport", icon: "🚇" },
  { key: "banking", label: "Banking", icon: "🏦" },
  { key: "mobile", label: "Mobile", icon: "📱" },
  { key: "food", label: "Food", icon: "🍜" },
  { key: "emergency", label: "Emergency", icon: "🚨" },
];

export default function Guides() {
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Guide | null>(null);

  const guidesQuery = useQuery({
    queryKey: ["guides", category],
    queryFn: () =>
      apiGet<Guide[]>(
        category ? `/api/guides?category=${category}` : "/api/guides"
      ),
  });

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Knowledge base
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Digital guides
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Step-by-step guides to help you navigate everyday life in
              Kazakhstan.
            </p>
          </div>
        </section>

        {/* Category filter */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-colors ${
                    category === cat.key
                      ? "bg-primary text-white"
                      : "bg-bg-light text-text-dark hover:bg-gray-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Guides grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {guidesQuery.isLoading ? (
              <LoadingSpinner label="Loading guides..." />
            ) : guidesQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(guidesQuery.error as Error)?.message ||
                  "Failed to load guides"}
              </div>
            ) : (guidesQuery.data || []).length === 0 ? (
              <div className="card p-8 text-center text-muted">
                No guides in this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(guidesQuery.data || []).map((guide) => {
                  const cat =
                    categories.find((c) => c.key === guide.category) ||
                    categories[0];
                  return (
                    <button
                      key={guide.id}
                      onClick={() => setSelected(guide)}
                      className="card p-7 text-left group"
                    >
                      <div className="text-4xl mb-4">{cat.icon}</div>
                      <span className="badge-red mb-3 capitalize">
                        {guide.category}
                      </span>
                      <h3 className="text-lg font-bold text-navy mt-3 mb-2 group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-muted line-clamp-3">
                        {guide.content}
                      </p>
                      <span className="text-primary font-semibold text-sm mt-4 inline-flex items-center gap-1">
                        Read guide <span aria-hidden>→</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Guide reader modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-md max-w-3xl w-full shadow-2xl border-t-4 border-primary my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 md:p-10 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <span className="badge-red capitalize mb-2">
                      {selected.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-navy mt-2">
                      {selected.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-muted hover:text-primary text-2xl flex-shrink-0"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="prose prose-sm max-w-none text-text-dark whitespace-pre-wrap leading-relaxed">
                  {selected.content}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
