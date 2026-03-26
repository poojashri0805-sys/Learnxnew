import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { CalendarDays, BookOpen, Sparkles, Link as LinkIcon, CircleHelp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

export default function LessonPlanner() {
    const { user } = useAuth();

    const [subject, setSubject] = useState("");
    const [className, setClassName] = useState("");
    const [lessonTitle, setLessonTitle] = useState("");
    const [lessonContent, setLessonContent] = useState("");
    const [startDate, setStartDate] = useState("");
    const [deadline, setDeadline] = useState("");
    const [workingDays, setWorkingDays] = useState([]);
    const [periodsPerDay, setPeriodsPerDay] = useState(1);
    const [hoursPerPeriod, setHoursPerPeriod] = useState(1);
    const [learningGoal, setLearningGoal] = useState("");
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggleWorkingDay = (day) => {
        if (workingDays.includes(day)) {
            setWorkingDays(workingDays.filter((d) => d !== day));
        } else {
            setWorkingDays([...workingDays, day]);
        }
    };

    const handleGeneratePlan = async () => {
        if (
            !subject ||
            !className ||
            !lessonTitle ||
            !lessonContent ||
            !startDate ||
            !deadline ||
            workingDays.length === 0 ||
            !periodsPerDay ||
            !hoursPerPeriod
        ) {
            alert("Please fill all required lesson planning fields");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("http://localhost:5000/api/lesson-planner", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subject,
                    className,
                    lessonTitle,
                    lessonContent,
                    startDate,
                    deadline,
                    workingDays,
                    periodsPerDay,
                    hoursPerPeriod,
                    learningGoal,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to generate lesson plan");
                setLoading(false);
                return;
            }

            setGeneratedPlan(data.lessonPlan || null);

            const lessonPayload = {
                id: Date.now(),
                teacherName: user?.name || user?.fullName || "Teacher",
                subject,
                className,
                lessonTitle,
                lessonContent,
                startDate,
                deadline,
                workingDays,
                periodsPerDay,
                hoursPerPeriod,
                learningGoal,
                generatedPlan: data.lessonPlan || null,
                createdAt: new Date().toISOString(),
            };

            const existingPlans = JSON.parse(localStorage.getItem("lessonPlans")) || [];
            existingPlans.push(lessonPayload);
            localStorage.setItem("lessonPlans", JSON.stringify(existingPlans));
        } catch (error) {
            console.error(error);
            alert("Lesson plan generation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Lesson Planner</h1>
                    <p className="text-gray-500 mt-1">
                        Generate adaptive lesson plans with schedule, resources, revision support, and topic-wise practice.
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        Lesson Plan Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-2">Subject</label>
                            <input
                                type="text"
                                placeholder="e.g. Physics"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Class</label>
                            <select
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            >
                                <option value="">Select class</option>
                                <option value="Grade 6">Grade 6</option>
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Lesson Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Newton's Laws of Motion"
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Lesson Content</label>
                            <textarea
                                rows={7}
                                placeholder="Paste chapter notes or full lesson content here..."
                                value={lessonContent}
                                onChange={(e) => setLessonContent(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 resize-none focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Learning Goal</label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Students should understand the laws and solve conceptual plus numerical problems."
                                value={learningGoal}
                                onChange={(e) => setLearningGoal(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 resize-none focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Periods per Day</label>
                            <input
                                type="number"
                                min="1"
                                value={periodsPerDay}
                                onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Hours per Period</label>
                            <input
                                type="number"
                                min="1"
                                step="0.5"
                                value={hoursPerPeriod}
                                onChange={(e) => setHoursPerPeriod(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-3">Working Days</label>
                            <div className="flex flex-wrap gap-2">
                                {weekDays.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleWorkingDay(day)}
                                        className={`px-4 py-2 rounded-xl border text-sm ${workingDays.includes(day)
                                                ? "bg-purple-600 text-white border-purple-600"
                                                : "bg-white text-gray-700 border-gray-300"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGeneratePlan}
                        disabled={loading}
                        className="mt-6 w-full md:w-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        {loading ? "Generating..." : "Generate Lesson Plan"}
                    </button>
                </div>

                {!generatedPlan ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
                        <CalendarDays className="w-14 h-14 text-purple-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">Your AI lesson plan will appear here</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Generate the plan to see lesson overview, topic breakdown, day-wise schedule,
                            resources, revision support, student risk areas, and topic-wise practice questions.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-2xl font-bold mb-2">{generatedPlan.lessonTitle}</h2>
                            <p className="text-gray-600 mb-5">{generatedPlan.summary}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="border rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Subject</p>
                                    <p className="font-semibold">{generatedPlan.subject}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Class</p>
                                    <p className="font-semibold">{generatedPlan.className}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Start Date</p>
                                    <p className="font-semibold">{generatedPlan.startDate}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Deadline</p>
                                    <p className="font-semibold">{generatedPlan.deadline}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Teaching Days</p>
                                    <p className="font-semibold">{generatedPlan.totalTeachingDays}</p>
                                </div>
                                <div className="border rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Total Periods</p>
                                    <p className="font-semibold">{generatedPlan.totalPeriodsAvailable}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-xl font-semibold mb-4">Topic Breakdown</h3>
                            <div className="space-y-4">
                                {generatedPlan.topics?.map((topic, index) => (
                                    <div key={index} className="border rounded-2xl p-5">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                                            <h4 className="text-lg font-semibold">{topic.topicName}</h4>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                                                    {topic.difficulty}
                                                </span>
                                                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                                                    {topic.estimatedPeriods} periods
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-700">
                                            <p><span className="font-medium">Learning Outcome:</span> {topic.learningOutcome}</p>
                                            <p><span className="font-medium">Activity:</span> {topic.activity}</p>
                                            <p><span className="font-medium">Assessment:</span> {topic.assessment}</p>
                                        </div>

                                        <div className="mt-4 border-t pt-4">
                                            <h5 className="font-semibold mb-2 flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4 text-purple-600" />
                                                Resources
                                            </h5>
                                            <div className="bg-slate-50 rounded-xl p-4 text-sm">
                                                <p><span className="font-medium">Title:</span> {topic.resourceTitle || topic.resource}</p>
                                                <p><span className="font-medium">Source:</span> {topic.resourceSource || "Suggested Resource"}</p>
                                                {topic.resourceLink ? (
                                                    <a
                                                        href={topic.resourceLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-purple-600 font-medium break-all"
                                                    >
                                                        {topic.resourceLink}
                                                    </a>
                                                ) : (
                                                    <p className="text-gray-500">No direct link provided yet</p>
                                                )}
                                            </div>
                                        </div>
                                        {topic.videoLink ? (
                                            <a
                                                href={topic.videoLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block mt-2 text-red-600 font-medium break-all"
                                            >
                                                {topic.videoTitle || "Watch video resource"}
                                            </a>
                                        ) : (
                                            <p className="text-gray-500 mt-2">No video link provided yet</p>
                                        )}

                                        <div className="mt-4 border-t pt-4">
                                            <h5 className="font-semibold mb-3 flex items-center gap-2">
                                                <CircleHelp className="w-4 h-4 text-purple-600" />
                                                Topic-wise Practice Questions
                                            </h5>
                                            <div className="space-y-3">
                                                {topic.practiceQuestions?.map((q, qIndex) => (
                                                    <div key={qIndex} className="bg-slate-50 rounded-xl p-4">
                                                        <p className="text-xs uppercase tracking-wide text-purple-600 font-semibold mb-1">
                                                            {q.type}
                                                        </p>
                                                        <p className="text-sm text-gray-800">{q.question}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-xl font-semibold mb-4">Period-wise Schedule</h3>
                            <div className="space-y-4">
                                {generatedPlan.schedule?.map((item, index) => (
                                    <div key={index} className="border rounded-2xl p-5">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                                            <h4 className="font-semibold">
                                                {item.day} • {item.date}
                                            </h4>
                                            <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                                Period {item.period}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-700">
                                            <p><span className="font-medium">Focus Topic:</span> {item.focusTopic}</p>
                                            <p><span className="font-medium">Goal:</span> {item.goal}</p>
                                            <p><span className="font-medium">Teaching Strategy:</span> {item.teachingStrategy}</p>
                                            <p><span className="font-medium">Resource:</span> {item.resource}</p>
                                            <p><span className="font-medium">Checkpoint:</span> {item.checkpoint}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Revision & Buffer</h3>
                                <div className="space-y-4">
                                    <div className="border rounded-xl p-4">
                                        <p className="font-semibold mb-1">Revision Plan</p>
                                        <p className="text-sm text-gray-700">
                                            {generatedPlan.revisionPlan?.day} - {generatedPlan.revisionPlan?.focus}
                                        </p>
                                    </div>

                                    <div className="border rounded-xl p-4">
                                        <p className="font-semibold mb-1">Buffer Plan</p>
                                        <p className="text-sm text-gray-700">
                                            {generatedPlan.bufferPlan?.day} - {generatedPlan.bufferPlan?.focus}
                                        </p>
                                    </div>

                                    <div className="border rounded-xl p-4">
                                        <p className="font-semibold mb-1">Fallback Plan</p>
                                        <p className="text-sm text-gray-700">{generatedPlan.fallbackPlan}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Student Risk Areas</h3>
                                <div className="space-y-3">
                                    {generatedPlan.riskAreas?.map((risk, index) => (
                                        <div key={index} className="border rounded-xl p-4 text-sm text-gray-700">
                                            {risk}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}