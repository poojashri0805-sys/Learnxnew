import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";

export default function TextbookUpload() {
    const [gradeClass, setGradeClass] = useState("");
    const [subject, setSubject] = useState("");
    const [title, setTitle] = useState("");
    const [pdf, setPdf] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState([]);

    const token = localStorage.getItem("token");

    const fetchBooks = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/textbooks", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setBooks(res.data || []);
        } catch (err) {
            console.error("Fetch books error:", err);
            setError("Failed to fetch uploaded textbooks");
        }
    };

    useEffect(() => {
        if (token) {
            fetchBooks();
        }
    }, [token]);

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!gradeClass || !subject || !title || !pdf) {
            setError("Please fill all fields and select a PDF");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const formData = new FormData();
            formData.append("gradeClass", gradeClass.trim());
            formData.append("subject", subject.trim());
            formData.append("title", title.trim());
            formData.append("pdf", pdf);

            await axios.post("http://localhost:5000/api/textbooks/upload", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            setMessage("Textbook uploaded and processed successfully");
            setGradeClass("");
            setSubject("");
            setTitle("");
            setPdf(null);

            fetchBooks();
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Textbook Upload">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h1 className="text-3xl font-bold mb-2">Upload Textbook</h1>
                    <p className="text-slate-600 mb-6">
                        Upload textbooks grade-wise so only the correct students can access them.
                    </p>

                    <form onSubmit={handleUpload} className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Grade/Class</label>
                            <input
                                type="text"
                                value={gradeClass}
                                onChange={(e) => setGradeClass(e.target.value)}
                                placeholder="Example: Grade 10"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Example: Science"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Example: Grade 10 Science Textbook"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">PDF File</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setPdf(e.target.files[0])}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium"
                            >
                                {loading ? "Uploading..." : "Upload Textbook"}
                            </button>
                        </div>
                    </form>

                    {message && (
                        <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-2xl font-semibold mb-4">Uploaded Textbooks</h2>

                    {books.length === 0 ? (
                        <p className="text-slate-500">No textbooks found.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {books.map((book) => (
                                <div
                                    key={book._id}
                                    className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                                >
                                    <h3 className="text-lg font-semibold">{book.title}</h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Subject: {book.subject}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Grade: {book.gradeClass}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1 break-all">
                                        PDF: {book.originalFileName}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}