import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";

const PerformanceTracker = () => {
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [grades, setGrades] = useState([]);
    const [selectedGradeData, setSelectedGradeData] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAddTestModal, setShowAddTestModal] = useState(false);
    const [newTestData, setNewTestData] = useState({
        testName: "",
        marksObtained: "",
        totalMarks: "",
        topics: "",
    });

    // Load available grades
    useEffect(() => {
        const loadGrades = async () => {
            try {
                const response = await axios.get("/api/performance/grades");
                setGrades(response.data);
            } catch (error) {
                console.error("Error loading grades:", error);
            }
        };

        loadGrades();
    }, []);

    // Load dashboard data when subject is selected
    useEffect(() => {
        if (selectedGrade && selectedSubject) {
            const loadDashboard = async () => {
                try {
                    const response = await axios.get(
                        `/api/performance/dashboard/${selectedGrade}/${selectedSubject}`
                    );
                    setSelectedGradeData(response.data);
                } catch (error) {
                    console.error("Error loading dashboard:", error);
                }
            };

            loadDashboard();
        }
    }, [selectedGrade, selectedSubject]);

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedGrade || !selectedSubject) {
            alert("Please select grade and subject, and choose a file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("grade", selectedGrade);
        formData.append("subject", selectedSubject);

        try {
            const response = await axios.post("/api/performance/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert(`Success! ${response.data.message}`);
            // Reload dashboard
            window.location.reload();
        } catch (error) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    // Handle add test
    const handleAddTest = async () => {
        if (!newTestData.testName || !newTestData.marksObtained || !newTestData.totalMarks) {
            alert("Please fill all fields");
            return;
        }

        try {
            const topicsArray = newTestData.topics
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);

            await axios.post(
                `/api/performance/student/${selectedStudent.studentId}/${selectedGrade}/${selectedSubject}/test`,
                {
                    testName: newTestData.testName,
                    marksObtained: parseInt(newTestData.marksObtained),
                    totalMarks: parseInt(newTestData.totalMarks),
                    topics: topicsArray,
                }
            );

            alert("Test added successfully!");
            setShowAddTestModal(false);
            setNewTestData({ testName: "", marksObtained: "", totalMarks: "", topics: "" });
            window.location.reload();
        } catch (error) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    const COLORS = [
        "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1",
        "#d084d0", "#82d982", "#ffb347", "#6c5ce7", "#fab1a0",
    ];

    return (
        <DashboardLayout>
            <div className="p-6 bg-gray-50">
                <h1 className="text-3xl font-bold mb-6">📊 Performance Tracker</h1>

                {/* Upload Section */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-bold mb-4">Upload Performance Data</h2>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Grade</label>
                            <input
                                type="text"
                                placeholder="e.g., Grade 09"
                                value={selectedGrade || ""}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Subject</label>
                            <input
                                type="text"
                                placeholder="e.g., Physics"
                                value={selectedSubject || ""}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Upload File</label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* Grade Selector */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-bold mb-4">Select Class</h2>

                    <div className="flex flex-wrap gap-2">
                        {grades.map((g) => (
                            <button
                                key={g.grade}
                                onClick={() => setSelectedGrade(g.grade)}
                                className={`px-4 py-2 rounded font-semibold ${
                                    selectedGrade === g.grade
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-black hover:bg-gray-300"
                                }`}
                            >
                                {g.grade}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subject Selector */}
                {selectedGrade && (
                    <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-bold mb-4">Select Subject</h2>

                        <div className="flex flex-wrap gap-2">
                            {grades
                                .find((g) => g.grade === selectedGrade)
                                ?.subjects.map((subject) => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`px-4 py-2 rounded font-semibold ${
                                            selectedSubject === subject
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-black hover:bg-gray-300"
                                        }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* Dashboard View */}
                {selectedGradeData && (
                    <>
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-6 rounded-lg shadow">
                                <p className="text-gray-600">Total Students</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {selectedGradeData.stats.totalStudents}
                                </p>
                            </div>

                            <div className="bg-green-50 p-6 rounded-lg shadow">
                                <p className="text-gray-600">Average Score</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {selectedGradeData.stats.avgScore}%
                                </p>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg shadow">
                                <p className="text-gray-600">At Risk</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {selectedGradeData.stats.atRiskCount}
                                </p>
                            </div>

                            <div className="bg-yellow-50 p-6 rounded-lg shadow">
                                <p className="text-gray-600">Avg Attendance</p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {selectedGradeData.stats.avgAttendance}%
                                </p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* Topic-wise Performance */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-bold mb-4">📚 Topic-wise Performance</h3>
                                <div style={{ minHeight: "300px" }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={selectedGradeData.topicWiseStats}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="topic" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="averageScore" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Prediction Distribution */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-bold mb-4">📊 Status Distribution</h3>
                                <div style={{ minHeight: "300px" }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    {
                                                        name: "At Risk",
                                                        value: selectedGradeData.students.filter(
                                                            (s) => s.prediction === "At Risk"
                                                        ).length,
                                                    },
                                                    {
                                                        name: "Warning",
                                                        value: selectedGradeData.students.filter(
                                                            (s) => s.prediction === "Warning"
                                                        ).length,
                                                    },
                                                    {
                                                        name: "Safe",
                                                        value: selectedGradeData.students.filter(
                                                            (s) => s.prediction === "Safe"
                                                        ).length,
                                                    },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                <Cell fill="#ff7c7c" />
                                                <Cell fill="#ffc658" />
                                                <Cell fill="#82ca9d" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Students Table */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4">All Students</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-4 py-2 text-left">Student</th>
                                            <th className="border px-4 py-2 text-center">Score</th>
                                            <th className="border px-4 py-2 text-center">📊 Quiz Marks</th>
                                            <th className="border px-4 py-2 text-center">Attendance</th>
                                            <th className="border px-4 py-2 text-center">Status</th>
                                            <th className="border px-4 py-2 text-center">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {selectedGradeData.students.map((s) => (
                                            <tr key={s.studentId} className="border-b hover:bg-gray-50">
                                                <td className="border px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold">{s.fullName}</p>
                                                        <p className="text-sm text-gray-600">{s.studentId}</p>
                                                    </div>
                                                </td>
                                                <td className="border px-4 py-3 text-center font-semibold">{((s.performanceScore) || 0).toFixed(1)}%</td>
                                                <td className="border px-4 py-3 text-center">📝 {s.quizCount || 0} quizzes</td>
                                                <td className="border px-4 py-3 text-center">{s.attendance || 0}%</td>
                                                <td className="border px-4 py-3 text-center">
                                                    <span className={`px-3 py-1 rounded font-medium ${
                                                        s.prediction === "At Risk"
                                                            ? "bg-red-100 text-red-700"
                                                            : s.prediction === "Warning"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}>
                                                        {s.prediction}
                                                    </span>
                                                </td>
                                                <td className="border px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStudent(s);
                                                            setShowModal(true);
                                                        }}
                                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Student Profile Modal */}
                {showModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">{selectedStudent?.fullName}</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-2xl font-bold text-gray-600 hover:text-gray-900"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-gray-600 mb-6">{selectedStudent?.studentId} • {selectedStudent?.email}</p>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded">
                                    <p className="text-sm text-gray-600">Performance</p>
                                    <p className="text-2xl font-bold text-blue-600">{((selectedStudent?.performanceScore) || 0).toFixed(1)}%</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded">
                                    <p className="text-sm text-gray-600">Quiz Marks</p>
                                    <p className="text-2xl font-bold text-purple-600">📝 {selectedStudent?.quizCount || 0}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded">
                                    <p className="text-sm text-gray-600">Attendance</p>
                                    <p className="text-2xl font-bold text-orange-600">{selectedStudent?.attendance || 0}%</p>
                                </div>
                            </div>

                            {/* Prediction Badge */}
                            <div className={`p-4 rounded mb-6 ${
                                selectedStudent?.prediction === "At Risk"
                                    ? "bg-red-50 border-l-4 border-red-500"
                                    : selectedStudent?.prediction === "Warning"
                                    ? "bg-yellow-50 border-l-4 border-yellow-500"
                                    : "bg-green-50 border-l-4 border-green-500"
                            }`}>
                                <h3 className="font-bold text-lg">{selectedStudent?.prediction}</h3>
                                <p className="text-sm">
                                    {selectedStudent?.prediction === "At Risk"
                                        ? "This student needs immediate intervention. Consider one-on-one sessions."
                                        : selectedStudent?.prediction === "Warning"
                                        ? "This student is progressing but needs support in weak areas."
                                        : "This student is performing well. Encourage them to maintain this level."}
                                </p>
                            </div>

                            {/* Weak Topics */}
                            {selectedStudent?.weakTopics?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-red-600 mb-2">Weak Topics:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.weakTopics.map((topic) => (
                                            <span
                                                key={topic}
                                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strong Topics */}
                            {selectedStudent?.strongTopics?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-green-600 mb-2">Strong Topics:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.strongTopics.map((topic) => (
                                            <span
                                                key={topic}
                                                className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Topic Chart */}
                            {selectedStudent?.topicPerformance?.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-bold mb-2">Topic-wise Scores:</h4>
                                    <div style={{ minHeight: "250px" }}>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={selectedStudent.topicPerformance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="topic" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="averageScore" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setShowAddTestModal(true);
                                    }}
                                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    ➕ Add Test Marks
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Test Modal */}
                {showAddTestModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-6">Add Test Marks</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Test Name</label>
                                    <input
                                        type="text"
                                        value={newTestData.testName}
                                        onChange={(e) =>
                                            setNewTestData({ ...newTestData, testName: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded"
                                        placeholder="e.g., Unit Test 1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Marks Obtained</label>
                                    <input
                                        type="number"
                                        value={newTestData.marksObtained}
                                        onChange={(e) =>
                                            setNewTestData({ ...newTestData, marksObtained: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded"
                                        placeholder="e.g., 45"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Total Marks</label>
                                    <input
                                        type="number"
                                        value={newTestData.totalMarks}
                                        onChange={(e) =>
                                            setNewTestData({ ...newTestData, totalMarks: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded"
                                        placeholder="e.g., 50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Topics (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={newTestData.topics}
                                        onChange={(e) =>
                                            setNewTestData({ ...newTestData, topics: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded"
                                        placeholder="e.g., Physics, Mathematics"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={handleAddTest}
                                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddTestModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PerformanceTracker;
