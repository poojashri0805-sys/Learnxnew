import { useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

export default function Flashcards() {
  const [mode, setMode] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewTracked, setReviewTracked] = useState(false);

  const currentCard = useMemo(() => cards[current], [cards, current]);

  const trackFlashcardReview = async () => {
    if (reviewTracked) return;

    try {
      await api.post("/streak/complete/flashcard-review");
      setReviewTracked(true);
    } catch (err) {
      console.log("Streak update failed", err);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      if (mode === "pdf" && pdfFile) {
        formData.append("pdf", pdfFile);
      }

      const res = await api.post("/ai/flashcards", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setCards(res.data.flashcards || []);
      setCurrent(0);
      setFlipped(false);
      setReviewTracked(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error generating flashcards");
    } finally {
      setLoading(false);
    }
  };

  const nextCard = async () => {
    if (!cards.length) return;

    if (current === cards.length - 1) {
      await trackFlashcardReview();
    }

    setCurrent((prev) => (prev + 1) % cards.length);
    setFlipped(false);
  };

  const prevCard = () => {
    if (!cards.length) return;
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length);
    setFlipped(false);
  };

  const restartDeck = () => {
    setCurrent(0);
    setFlipped(false);
  };

  return (
    <DashboardLayout title="Flashcards">
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Generate Flashcards
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter a title and content, or upload a PDF to generate revision cards.
          </p>

          <div className="mt-5 inline-flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                mode === "text"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-600"
              }`}
            >
              Enter Text
            </button>
            <button
              type="button"
              onClick={() => setMode("pdf")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                mode === "pdf"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-600"
              }`}
            >
              Upload PDF
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Title / Topic
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Newton's Laws"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {mode === "text" ? (
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Notes / Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste notes, lecture content, or a topic summary..."
                  className="w-full min-h-[180px] rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Upload PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Selected file: {pdfFile ? pdfFile.name : "No file chosen"}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-medium shadow-md shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-70"
          >
            {loading ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>

        {cards.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 text-sm">
                {cards.length} Cards Generated
              </span>
              <span className="px-3 py-1 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 text-sm">
                {current + 1}/{cards.length}
              </span>
            </div>

            <div
              onClick={() => setFlipped((prev) => !prev)}
              className="w-full max-w-3xl min-h-[260px] rounded-2xl cursor-pointer flex flex-col items-center justify-center px-8 text-center text-white shadow-xl bg-gradient-to-br from-indigo-600 to-blue-600"
            >
              <div className="inline-flex px-3 py-1 rounded-md bg-white/15 text-sm mb-4">
                {currentCard?.topic || "Flashcard"}
              </div>

              <div className="text-2xl md:text-3xl font-semibold">
                {flipped ? currentCard?.back : currentCard?.front}
              </div>

              <div className="mt-4 text-sm text-white/70">
                Click to reveal answer
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={prevCard}
                className="w-12 h-12 rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                &lt;
              </button>

              <div className="min-w-16 text-center text-slate-700">
                {current + 1} / {cards.length}
              </div>

              <button
                onClick={nextCard}
                className="w-12 h-12 rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                &gt;
              </button>
            </div>

            <button
              onClick={restartDeck}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Restart Deck
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
