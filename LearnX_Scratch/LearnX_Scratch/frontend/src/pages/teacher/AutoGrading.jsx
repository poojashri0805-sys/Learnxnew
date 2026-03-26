import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

export default function AutoGrading() {
    const [results, setResults] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const allResults = JSON.parse(localStorage.getItem("quizResults")) || [];

        const teacherResults = allResults.filter(
            (result) =>
                result.teacherName &&
                (result.teacherName === (user?.name || user?.fullName || "Teacher"))
        );

        setResults(teacherResults);
    }, [user]);

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Auto Grading</h1>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {results.length === 0 ? (
                        <p className="text-gray-500">No student submissions yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-3">Student</th>
                                        <th className="pb-3">Email</th>
                                        <th className="pb-3">Class</th>
                                        <th className="pb-3">Subject</th>
                                        <th className="pb-3">Topic</th>
                                        <th className="pb-3">Score</th>
                                        <th className="pb-3">Time Taken</th>
                                        <th className="pb-3">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result) => (
                                        <tr key={result.id} className="border-b">
                                            <td className="py-3">{result.studentName}</td>
                                            <td className="py-3">{result.studentEmail}</td>
                                            <td className="py-3">{result.studentClass}</td>
                                            <td className="py-3">{result.subject}</td>
                                            <td className="py-3">{result.topic}</td>
                                            <td className="py-3">
                                                {result.score} / {result.total}
                                            </td>
                                            <td className="py-3">{result.timeTaken}s</td>
                                            <td className="py-3">
                                                {new Date(result.submittedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}