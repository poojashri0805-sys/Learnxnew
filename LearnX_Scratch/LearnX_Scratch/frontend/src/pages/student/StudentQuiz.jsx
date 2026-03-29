import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

export default function StudentQuiz() {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(60);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await api.get("/quizzes");
                const availableQuizzes = res.data || [];
                setQuizzes(availableQuizzes);
                return;
            } catch (err) {
                console.error("Failed to load quizzes from server, falling back to local storage", err);
            }

            const allQuizzes = JSON.parse(localStorage.getItem("publishedQuizzes")) || [];
            const studentClass =
                user?.grade ||
                user?.gradeClass ||
                user?.className ||
                user?.class ||
                "";

            const completedQuizzes = JSON.parse(localStorage.getItem("completedQuizzes")) || {};
            const studentKey = user?.email || user?.id || "anonymous";
            const studentCompletedIds = completedQuizzes[studentKey] || [];

            const filteredQuizzes = allQuizzes.filter(
                (quiz) => {
                    const quizId = quiz._id || quiz.id || "";
                    return (
                        quiz.className &&
                        studentClass &&
                        quiz.className.trim().toLowerCase() === studentClass.trim().toLowerCase() &&
                        !studentCompletedIds.includes(quizId)
                    );
                }
            );

            setQuizzes(filteredQuizzes);
        };

        fetchQuizzes();
    }, [user]);

    useEffect(() => {
        if (!started || submitted) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [started, timeLeft, submitted]);

    const handleOptionClick = (option) => {
        setAnswers({
            ...answers,
            [currentQuestion]: option,
        });
    };

    // Helper function to check if answer is correct (used for both scoring and display)
    const isAnswerCorrect = (selected, correctAnswer, options) => {
        if (!selected || !correctAnswer) return false;

        const selectedValue = selected.trim().toLowerCase();
        const correctValue = correctAnswer.trim().toLowerCase();

        // Direct text match
        if (selectedValue === correctValue) return true;

        // Check if correctAnswer is a letter (A-D)
        if (/^[A-D]$/i.test(correctAnswer.trim())) {
            const correctLetterIndex = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65;
            const correctOption = (options?.[correctLetterIndex] || "").trim().toLowerCase();
            if (selectedValue === correctOption) return true;
        }

        // Check if selected is a letter and correctAnswer is full text
        if (/^[A-D]$/i.test(selected.trim())) {
            const selectedLetterIndex = selected.trim().toUpperCase().charCodeAt(0) - 65;
            const selectedOption = (options?.[selectedLetterIndex] || "").trim().toLowerCase();
            if (selectedOption === correctValue) return true;
        }

        return false;
    };

    const handleNext = () => {
        if (currentQuestion < selectedQuiz.questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        let marks = 0;

        selectedQuiz.questions.forEach((q, index) => {
            const selected = answers[index];
            if (isAnswerCorrect(selected, q.correctAnswer, q.options)) {
                marks++;
            }
        });

        const quizId = selectedQuiz._id || selectedQuiz.id || "";
        const quizTitle = selectedQuiz.title || selectedQuiz.topic || "Quiz";
        const resultPayload = {
            id: Date.now(),
            quizId,
            teacherName: selectedQuiz.teacherName,
            subject: selectedQuiz.subject,
            topic: selectedQuiz.topic,
            className: selectedQuiz.className,
            studentName: user?.name || user?.fullName || "Student",
            studentEmail: user?.email || "",
            studentClass:
                user?.grade ||
                user?.gradeClass ||
                user?.className ||
                user?.class ||
                "",
            score: marks,
            total: selectedQuiz.questions.length,
            submittedAt: new Date().toISOString(),
            timeTaken: selectedQuiz.timer - timeLeft,
        };

        const existingResults =
            JSON.parse(localStorage.getItem("quizResults")) || [];

        existingResults.push(resultPayload);

        localStorage.setItem("quizResults", JSON.stringify(existingResults));

        try {
            await api.post("/quiz-results", {
                quizId,
                quizTitle,
                subject: selectedQuiz.subject,
                topic: selectedQuiz.topic,
                teacherName: selectedQuiz.teacherName,
                className: selectedQuiz.className,
                score: marks,
                total: selectedQuiz.questions.length,
                submittedAt: new Date().toISOString(),
            });

            // Refresh notification list immediately after saving quiz grade
            window.dispatchEvent(new Event("notification-refresh"));
        } catch (err) {
            console.log("Quiz result save failed", err);
        }

        try {
            await api.post("/streak/complete/quiz-attempt");
        } catch (err) {
            console.log("Streak update failed", err);
        }

        // Mark this quiz as completed for this student
        const completedQuizzes =
            JSON.parse(localStorage.getItem("completedQuizzes")) || {};
        const studentKey = user?.email || user?.id || "anonymous";

        if (!completedQuizzes[studentKey]) {
            completedQuizzes[studentKey] = [];
        }
        completedQuizzes[studentKey].push(quizId);
        localStorage.setItem("completedQuizzes", JSON.stringify(completedQuizzes));

        // Remove from current view
        setQuizzes((prev) => prev.filter((quiz) => (quiz._id || quiz.id) !== quizId));

        setScore(marks);
        setSubmitted(true);
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Quiz</h1>

                {!selectedQuiz ? (
                    quizzes.length === 0 ? (
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <p className="text-gray-600">No quizzes available.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quizzes.map((quiz) => {
                                const quizId = quiz._id || quiz.id || Date.now();
                                return (
                                    <div key={quizId} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <h2 className="text-xl font-semibold mb-3">{quiz.topic}</h2>
                                    <p className="text-gray-700 mb-2">
                                        Teacher: <span className="font-medium">{quiz.teacherName}</span>
                                    </p>
                                    <p className="text-gray-700 mb-2">
                                        Subject: <span className="font-medium">{quiz.subject}</span>
                                    </p>
                                    <p className="text-gray-700 mb-4">
                                        Class: <span className="font-medium">{quiz.className}</span>
                                    </p>

                                    <button
                                        onClick={() => {
                                            setSelectedQuiz(quiz);
                                            setStarted(false);
                                            setCurrentQuestion(0);
                                            setAnswers({});
                                            setTimeLeft(quiz.timer || 60);
                                            setSubmitted(false);
                                            setScore(0);
                                        }}
                                        className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                                    >
                                        View Quiz
                                    </button>
                                </div>
                            )})}
                        </div>
                    )
                ) : !started ? (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-3">{selectedQuiz.topic}</h2>
                        <p className="text-gray-700 mb-2">
                            Teacher: <span className="font-medium">{selectedQuiz.teacherName}</span>
                        </p>
                        <p className="text-gray-700 mb-2">
                            Subject: <span className="font-medium">{selectedQuiz.subject}</span>
                        </p>
                        <p className="text-gray-700 mb-4">
                            Class: <span className="font-medium">{selectedQuiz.className}</span>
                        </p>

                        <button
                            onClick={() => setStarted(true)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                        >
                            Start Quiz
                        </button>
                    </div>
                ) : submitted ? (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                        <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
                        <p className="text-lg mb-2">
                            Score: <span className="font-semibold">{score}</span> /{" "}
                            {selectedQuiz.questions.length}
                        </p>
                        <p className="text-gray-600 mb-6">
                            Time taken: {(selectedQuiz.timer || 60) - timeLeft} seconds
                        </p>

                        <div className="space-y-6">
                            {selectedQuiz.questions.map((q, index) => (
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <h3 className="font-semibold mb-3">
                                        {index + 1}. {q.question}
                                    </h3>

                                    <div className="space-y-2">
                                        {q.options?.map((opt, i) => {
                                            // Check if this option is the correct one
                                            const isCorrect = isAnswerCorrect(opt, q.correctAnswer, q.options);

                                            const isSelected = isAnswerCorrect(answers[index], opt, q.options);

                                            return (
                                                <div
                                                    key={i}
                                                    className={`border rounded-lg px-4 py-2 ${
                                                        isCorrect
                                                            ? "bg-green-100 border-green-500"
                                                            : isSelected
                                                                ? "bg-red-100 border-red-500"
                                                                : "border-gray-300"
                                                    }`}
                                                >
                                                    {String.fromCharCode(65 + i)}. {opt}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-2 text-sm text-gray-700">
                                        Your Answer: {answers[index] || "Not answered"}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Correct Answer: {q.correctAnswer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">{selectedQuiz.topic}</h2>
                            <div className="text-red-600 font-semibold">
                                Time Left: {timeLeft}s
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">
                                Question {currentQuestion + 1} of {selectedQuiz.questions.length}
                            </p>
                            <h3 className="text-lg font-semibold mb-4">
                                {selectedQuiz.questions[currentQuestion].question}
                            </h3>

                            <div className="space-y-3">
                                {selectedQuiz.questions[currentQuestion].options?.map((opt, i) => {
                                    const isSelected = answers[currentQuestion] === opt;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionClick(opt)}
                                            className={`block w-full text-left border rounded-lg px-4 py-3 ${
                                                isSelected
                                                    ? "bg-blue-100 border-blue-500"
                                                    : "border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {String.fromCharCode(65 + i)}. {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0}
                                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {currentQuestion === selectedQuiz.questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    className="bg-green-600 text-white px-5 py-2 rounded-lg"
                                >
                                    Submit Quiz
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
