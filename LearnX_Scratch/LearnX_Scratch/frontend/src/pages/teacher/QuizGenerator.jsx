import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Sparkles, Brain } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function QuizGenerator() {
    const [activeTab, setActiveTab] = useState("generator");
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("");
    const [quizType, setQuizType] = useState("MCQ");
    const [difficulty, setDifficulty] = useState("Medium");
    const [numQuestions, setNumQuestions] = useState(3);
    const [questions, setQuestions] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const { user } = useAuth();
    const [quizBank, setQuizBank] = useState([]);
    const [subject, setSubject] = useState("");
    const [quizTimer, setQuizTimer] = useState(60);
    const [viewQuizModal, setViewQuizModal] = useState(null);

    // BACKEND - UNCHANGED FROM ORIGINAL
    const handleGenerate = async () => {
        if (!subject || !topic || !content || !selectedClass || !quizTimer) {
            alert("Please fill subject, topic, class, content, and timer");
            return;
        }
        try {
            const res = await fetch("http://localhost:5000/api/ai/quiz", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content,
                    quizType,
                    difficulty,
                    numQuestions
                }),
            });

            const data = await res.json();
            const generatedQuestions = data.questions || [];
            setQuestions(generatedQuestions);

            const quizPayload = {
                topic,
                subject,
                timer: quizTimer,
                className: selectedClass,
                teacherName: user?.name || user?.fullName || "Teacher",
                questions: generatedQuestions,
            };

            localStorage.setItem("latestQuiz", JSON.stringify(quizPayload));
        } catch (err) {
            console.error(err);
        }
    };
    const handleSendQuiz = async () => {
        if (!topic || !selectedClass || questions.length === 0) {
            alert("Generate the quiz first, then send it.");
            return;
        }

        const quizPayload = {
            title: topic,
            topic,
            subject,
            timer: quizTimer,
            type: quizType,
            difficulty,
            className: selectedClass,
            teacherName: user?.name || user?.fullName || "Teacher",
            questions,
        };

        try {
            const response = await api.post("/quizzes", quizPayload);
            const savedQuiz = response.data;

            const publishedQuiz = {
                id: savedQuiz._id || savedQuiz.id || Date.now(),
                ...quizPayload,
                sentAt: savedQuiz.sentAt || new Date().toISOString(),
            };

            const existingPublishedQuizzes =
                JSON.parse(localStorage.getItem("publishedQuizzes")) || [];
            existingPublishedQuizzes.push(publishedQuiz);
            localStorage.setItem("publishedQuizzes", JSON.stringify(existingPublishedQuizzes));

            const existingQuizBank =
                JSON.parse(localStorage.getItem("quizBank")) || [];
            existingQuizBank.push(publishedQuiz);
            localStorage.setItem("quizBank", JSON.stringify(existingQuizBank));

            const currentTeacherName = user?.name || user?.fullName || "Teacher";
            const teacherQuizzes = existingQuizBank.filter(
                (quiz) => quiz.teacherName === currentTeacherName
            );
            setQuizBank(teacherQuizzes);
            window.dispatchEvent(new Event("notification-refresh"));

            alert("Quiz sent to students successfully and notifications were delivered.");
        } catch (err) {
            console.error("Failed to send quiz to server", err);
            alert("Could not send quiz to server. Students may not receive notifications.");
        }
    };
    const getQuizStats = (quizId) => {
        const results = JSON.parse(localStorage.getItem("quizResults")) || [];

        const matchedResults = results.filter((result) => result.quizId === quizId);

        const attempts = matchedResults.length;

        const avgScore =
            attempts === 0
                ? 0
                : Math.round(
                    matchedResults.reduce(
                        (sum, result) => sum + (result.score / result.total) * 100,
                        0
                    ) / attempts
                );

        return { attempts, avgScore };
    };
    useEffect(() => {
        const allQuizzes = JSON.parse(localStorage.getItem("quizBank")) || [];

        const currentTeacherName = user?.name || user?.fullName || "Teacher";

        const teacherQuizzes = allQuizzes.filter(
            (quiz) => quiz.teacherName === currentTeacherName
        );

        setQuizBank(teacherQuizzes);
    }, [user]);

    return (
        <DashboardLayout>
            <div className="p-6">

                {/* TABS */}
                <div className="flex gap-0 mb-6">
                    <button
                        onClick={() => setActiveTab("generator")}
                        className={`px-6 py-3 font-medium border border-gray-300 ${activeTab === "generator"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700"
                            }`}
                        style={{ borderTopLeftRadius: '4px' }}
                    >
                        Quiz Generator
                    </button>

                    <button
                        onClick={() => setActiveTab("bank")}
                        className={`px-6 py-3 font-medium border border-l-0 border-gray-300 ${activeTab === "bank"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700"
                            }`}
                    >
                        Quiz Bank
                    </button>
                </div>

                {/* GENERATOR TAB */}
                {activeTab === "generator" && (
                    <div className="flex gap-6">

                        {/* LEFT PANEL */}
                        <div className="w-[420px] bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-6">Quiz Configuration</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Subject
                                </label>
                                <input
                                    placeholder="e.g. Science"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Topic / Subject */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Topic
                                </label>
                                <input
                                    placeholder="e.g. Newton's Laws of Motion"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Class
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select class</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </select>
                            </div>

                            {/* Notes / Content */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Notes / Content
                                </label>
                                <textarea
                                    placeholder="Paste lecture notes or textbook content..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={6}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Quiz Type */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Quiz Type
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setQuizType("MCQ")}
                                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${quizType === "MCQ"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        MCQ
                                    </button>
                                    <button
                                        onClick={() => setQuizType("Short Answer")}
                                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${quizType === "Short Answer"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        Short Answer
                                    </button>
                                    <button
                                        onClick={() => setQuizType("Conceptual")}
                                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${quizType === "Conceptual"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        Conceptual
                                    </button>
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Difficulty
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDifficulty("Easy")}
                                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${difficulty === "Easy"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        Easy
                                    </button>
                                    <button
                                        onClick={() => setDifficulty("Medium")}
                                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${difficulty === "Medium"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        Medium
                                    </button>
                                    <button
                                        onClick={() => setDifficulty("Hard")}
                                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${difficulty === "Hard"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        Hard
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Quiz Timer (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    value={quizTimer}
                                    onChange={(e) => setQuizTimer(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Number of Questions */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">
                                    Number of Questions: {numQuestions}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    style={{
                                        background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${((numQuestions - 1) / 19) * 100}%, rgb(229 231 235) ${((numQuestions - 1) / 19) * 100}%, rgb(229 231 235) 100%)`
                                    }}
                                />
                            </div>
                            

                            {/* Generate Button */}
                            <button
                            
                                onClick={handleGenerate}
                                className="w-full bg-blue-400 hover:bg-blue-500 text-white py-3 rounded font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generate Quiz
                            </button>
                            <button
                                onClick={handleSendQuiz}
                                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-medium transition-colors"
                            >
                                Send Quiz to Class
                            </button>
                        </div>

                        {/* RIGHT PANEL */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-8">
                            {questions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="mb-4">
                                        <Brain className="w-16 h-16 text-pink-400" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-gray-400 text-center">
                                        Configure and generate a quiz to see questions here
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {questions.map((q, index) => (
                                        <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                                            <h3 className="font-semibold mb-3">
                                                {index + 1}. {q.question}
                                            </h3>

                                            {q.options && (
                                                <div className="space-y-2">
                                                    {q.options.map((opt, i) => {
                                                        const optionLetter = String.fromCharCode(65 + i);
                                                        const isCorrect =
                                                            q.correctAnswer === opt ||
                                                            q.correctAnswer === optionLetter ||
                                                            q.correctAnswer === `${optionLetter}` ||
                                                            q.correctAnswer === `${optionLetter}. ${opt}` ||
                                                            q.correctAnswer?.toLowerCase().trim() === opt?.toLowerCase().trim();

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`border rounded px-4 py-2 text-sm transition-colors ${isCorrect
                                                                        ? "bg-green-100 border-green-500 font-semibold"
                                                                        : "border-gray-200 hover:bg-gray-50"
                                                                    }`}
                                                            >
                                                                {optionLetter}. {opt}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* QUIZ BANK TAB */}
                {activeTab === "bank" && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="font-semibold mb-4">Quiz Bank</h2>

                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b">
                                    <th className="pb-3">Subject</th>
                                    <th className="pb-3">Topic</th>
                                    <th className="pb-3">Type</th>
                                    <th className="pb-3">Difficulty</th>
                                    <th className="pb-3">Class</th>
                                    <th className="pb-3">Timer</th>
                                    <th className="pb-3">Attempts</th>
                                    <th className="pb-3">Avg Score</th>
                                    <th className="pb-3">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {quizBank.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-6 text-center text-gray-400">
                                            No quizzes sent yet
                                        </td>
                                    </tr>
                                ) : (
                                    quizBank.map((quiz) => {
                                        const { attempts, avgScore } = getQuizStats(quiz.id);

                                        return (
                                            <tr key={quiz.id} className="border-b">
                                                <td className="py-3">{quiz.subject}</td>
                                                <td className="py-3">{quiz.topic}</td>
                                                <td className="py-3">{quiz.type}</td>
                                                <td
                                                    className={`py-3 ${quiz.difficulty === "Easy"
                                                            ? "text-green-500"
                                                            : quiz.difficulty === "Medium"
                                                                ? "text-yellow-500"
                                                                : "text-red-500"
                                                        }`}
                                                >
                                                    {quiz.difficulty}
                                                </td>
                                                <td className="py-3">{quiz.className}</td>
                                                <td className="py-3">{quiz.timer}s</td>
                                                <td className="py-3">{attempts}</td>
                                                <td className="py-3">{avgScore}%</td>
                                                <td className="py-3">
                                                    <button
                                                        onClick={() => setViewQuizModal(quiz)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            {/* VIEW QUIZ MODAL */}
            {viewQuizModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">{viewQuizModal.topic}</h2>
                            <button
                                onClick={() => setViewQuizModal(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-2">
                            <p className="text-gray-600">
                                <strong>Subject:</strong> {viewQuizModal.subject}
                            </p>
                            <p className="text-gray-600">
                                <strong>Class:</strong> {viewQuizModal.className}
                            </p>
                            <p className="text-gray-600">
                                <strong>Difficulty:</strong> {viewQuizModal.difficulty}
                            </p>
                            <p className="text-gray-600">
                                <strong>Quiz Type:</strong> {viewQuizModal.type}
                            </p>
                        </div>

                        <div className="border-t p-6">
                            <h3 className="text-xl font-semibold mb-6">Questions</h3>
                            <div className="space-y-8">
                                {viewQuizModal.questions?.map((q, index) => (
                                    <div key={index} className="border-b pb-6 last:border-b-0">
                                        <h4 className="font-semibold mb-4 text-lg">
                                            {index + 1}. {q.question}
                                        </h4>

                                        {q.options && (
                                            <div className="space-y-3 ml-4">
                                                {q.options.map((opt, i) => {
                                                    const optionLetter = String.fromCharCode(65 + i);
                                                    const isCorrect =
                                                        q.correctAnswer === opt ||
                                                        q.correctAnswer === optionLetter ||
                                                        q.correctAnswer === `${optionLetter}` ||
                                                        q.correctAnswer === `${optionLetter}. ${opt}` ||
                                                        q.correctAnswer?.toLowerCase().trim() === opt?.toLowerCase().trim();

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`border rounded px-4 py-3 transition-colors ${isCorrect
                                                                    ? "bg-green-100 border-green-500 font-semibold text-green-900"
                                                                    : "border-gray-300 bg-gray-50"
                                                                }`}
                                                        >
                                                            {optionLetter}. {opt}
                                                            {isCorrect && (
                                                                <span className="ml-2 text-green-600 font-bold">✓ Correct</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t p-6 flex justify-end gap-3">
                            <button
                                onClick={() => setViewQuizModal(null)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
