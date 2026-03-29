import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, SendHorizonal, Plus } from "lucide-react";

const createSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function StudentAiTutor() {
    const { user } = useAuth();

    const [question, setQuestion] = useState("");
    const [currentMessages, setCurrentMessages] = useState([]);
    const [history, setHistory] = useState([]);
    const [textbooks, setTextbooks] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [sessionId, setSessionId] = useState(createSessionId());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");
    const gradeClass =
        user?.gradeClass || user?.grade || user?.className || user?.class || "";

    const uniqueSubjects = useMemo(() => {
        return [...new Set(textbooks.map((book) => book.subject).filter(Boolean))];
    }, [textbooks]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/chatbot/history", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setHistory(res.data || []);
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    };

    const fetchTextbooks = async () => {
        if (!gradeClass) return;

        try {
            const res = await axios.get(
                `http://localhost:5000/api/textbooks/${encodeURIComponent(gradeClass)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const books = res.data || [];
            setTextbooks(books);

            if (books.length > 0 && !selectedSubject) {
                setSelectedSubject(books[0].subject || "");
            }
        } catch (err) {
            console.error("Error fetching textbooks:", err);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchTextbooks();
    }, [gradeClass]);

    const handleNewChat = () => {
        setCurrentMessages([]);
        setQuestion("");
        setError("");
        setSessionId(createSessionId());
    };

    const openHistoryItem = (chat) => {
        setCurrentMessages([
            {
                type: "question",
                text: chat.question,
                id: `${chat._id}-q`,
            },
            {
                type: "answer",
                text: chat.answer,
                id: `${chat._id}-a`,
            },
        ]);
        setSelectedSubject(chat.subject || "");
        setSessionId(chat.sessionId || createSessionId());
    };

    const handleAsk = async () => {
        if (!question.trim()) {
            setError("Please enter a question");
            return;
        }

        if (!selectedSubject) {
            setError("Please select a subject");
            return;
        }

        const userQuestion = question;

        setCurrentMessages((prev) => [
            ...prev,
            {
                type: "question",
                text: userQuestion,
                id: Date.now() + "-q",
            },
        ]);

        setQuestion("");
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(
                "http://localhost:5000/api/chatbot/ask",
                {
                    question: userQuestion,
                    subject: selectedSubject,
                    sessionId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCurrentMessages((prev) => [
                ...prev,
                {
                    type: "answer",
                    text: res.data.answer,
                    id: Date.now() + "-a",
                },
            ]);

            fetchHistory();
        } catch (err) {
            console.error("Chatbot error:", err);
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="AI Tutor">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 h-[calc(100vh-140px)]">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col min-h-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:opacity-90 transition"
                    >
                        <Plus size={18} />
                        New Chat
                    </button>

                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Your Textbooks
                        </h2>
                        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                            {textbooks.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No textbooks uploaded for your class yet.
                                </p>
                            ) : (
                                textbooks.map((book) => (
                                    <div
                                        key={book._id}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                    >
                                        <div className="flex items-start gap-2">
                                            <BookOpen size={18} className="text-blue-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {book.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {book.subject}
                                                </p>
                                                <p className="text-xs text-slate-400 break-all mt-1">
                                                    {book.originalFileName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Subjects
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {uniqueSubjects.length === 0 ? (
                                <p className="text-sm text-slate-500">No subjects available.</p>
                            ) : (
                                uniqueSubjects.map((subj) => (
                                    <button
                                        key={subj}
                                        onClick={() => setSelectedSubject(subj)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedSubject === subj
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            }`}
                                    >
                                        {subj}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Previous Chats
                        </h2>

                        <div className="space-y-2 max-h-full overflow-y-auto pr-1">
                            {history.length === 0 ? (
                                <p className="text-sm text-slate-500">No previous chats yet.</p>
                            ) : (
                                [...history].reverse().map((chat) => (
                                    <button
                                        key={chat._id}
                                        onClick={() => openHistoryItem(chat)}
                                        className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition"
                                    >
                                        <p className="text-sm font-medium text-slate-800 line-clamp-2">
                                            {chat.question}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {chat.subject} • {chat.gradeClass}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full min-w-0">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h1 className="text-2xl font-bold text-slate-900">Chat with Your Tutor</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Answers are generated only from your grade-specific textbook content.
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Selected subject: <span className="font-medium">{selectedSubject || "None"}</span>
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50">
                        {currentMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center text-slate-500">
                                <div>
                                    <p className="text-lg font-medium">Start a new conversation</p>
                                    <p className="text-sm mt-1">
                                        Choose a subject and ask a question from your textbook.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            currentMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.type === "question" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-7 shadow-sm whitespace-pre-line ${msg.type === "question"
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                                : "bg-white border border-slate-200 text-slate-800"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 shadow-sm">
                                    Thinking...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 p-4 bg-white">
                        {error && (
                            <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <textarea
                                rows="2"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask anything from your textbook..."
                                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <button
                                onClick={handleAsk}
                                disabled={loading}
                                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                <SendHorizonal size={18} />
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
