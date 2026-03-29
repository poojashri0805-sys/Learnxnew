import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { CalendarDays, BookOpen, Sparkles, Link as LinkIcon, CircleHelp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

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

            const res = await api.post("/lesson-planner", {
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
            });

            const data = res.data;

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

            // Sync topics to Curriculum Tracker localStorage
            const CURRICULUM_STORAGE_KEY = "curriculum_grade_tracker_v5";
            const curriculumData = JSON.parse(localStorage.getItem(CURRICULUM_STORAGE_KEY)) || { gradeData: {} };
            
            if (!curriculumData.gradeData) {
                curriculumData.gradeData = {};
            }
            
            let gradeData = curriculumData.gradeData[className];
            if (!gradeData) {
                gradeData = { examDate: "", reminderNotes: "", subjects: [] };
                console.log(`[Curriculum Sync] Created new grade data for ${className}`);
            } else {
                console.log(`[Curriculum Sync] Loading existing grade data for ${className}`);
            }

            // Find or create subject in curriculum
            let subjectObj = gradeData.subjects.find(s => s.name.toLowerCase() === subject.toLowerCase());
            if (!subjectObj) {
                subjectObj = {
                    id: `subject-${Date.now()}`,
                    name: subject,
                    topics: []
                };
                gradeData.subjects.push(subjectObj);
                console.log(`[Curriculum Sync] Created new subject: ${subject}`);
            } else {
                console.log(`[Curriculum Sync] Using existing subject: ${subject} (${subjectObj.topics.length} existing topics)`);
            }

            // Add topics from lesson plan
            const topicsCount = data.lessonPlan?.topics?.length || 0;
            console.log(`[Curriculum Sync] Processing ${topicsCount} topics from lesson plan`);
            
            if (data.lessonPlan?.topics && topicsCount > 0) {
                data.lessonPlan.topics.forEach((topic, index) => {
                    const topicName = topic.topicName || topic.name;
                    if (topicName && topicName.trim()) {
                        // Check if topic already exists
                        const existingTopic = subjectObj.topics.find(
                            t => t.name.toLowerCase() === topicName.toLowerCase()
                        );
                        
                        if (!existingTopic) {
                            // Add new topic as "in-progress"
                            const newTopic = {
                                id: `topic-${Date.now()}-${Math.random()}`,
                                name: topicName.trim(),
                                status: "in-progress"
                            };
                            subjectObj.topics.push(newTopic);
                            console.log(`[Curriculum Sync] ✅ Added topic ${index + 1}/${topicsCount}: ${topicName}`);
                        } else {
                            console.log(`[Curriculum Sync] ⚠️ Skipped duplicate topic: ${topicName}`);
                        }
                    } else {
                        console.log(`[Curriculum Sync] ⚠️ Skipped empty topic at index ${index}`);
                    }
                });
            } else {
                console.log(`[Curriculum Sync] ⚠️ No topics to sync - either empty or undefined`);
            }

            // Save updated curriculum data
            curriculumData.gradeData[className] = gradeData;
            localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(curriculumData));
            console.log(`[Curriculum Sync] ✅ Saved curriculum data. Subject "${subject}" now has ${subjectObj.topics.length} total topics in localStorage`);

            // Dispatch custom event to notify CurriculumTracker about the update
            window.dispatchEvent(new CustomEvent("curriculumUpdated", {
              detail: {
                className,
                subject,
                topicsCount,
                timestamp: Date.now(),
                actualTopics: subjectObj.topics.length
              }
            }));
            console.log(`[Curriculum Sync] 📢 Dispatched curriculumUpdated event for ${className}/${subject}`);
            console.log(`[Curriculum Sync] 🔍 localStorage check - current data:`, JSON.parse(localStorage.getItem(CURRICULUM_STORAGE_KEY)));


            // Show success with curriculum update info
            const successMsg = `✅ Lesson plan created!\n\n📚 Topics added to Curriculum Tracker:\n${subject} - ${topicsCount} topics marked as "In Progress"`;
            alert(successMsg);
        } catch (error) {
            console.error("Lesson plan error:", error);
            const errorMsg = error?.response?.data?.message || error?.message || "Lesson plan generation failed";
            alert(errorMsg);
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
                        <BookOpen className="w-5 h-5 text-blue-600" />
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
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Class</label>
                            <select
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">Select class</option>
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
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Lesson Content</label>
                            <textarea
                                rows={7}
                                placeholder="Paste chapter notes or full lesson content here..."
                                value={lessonContent}
                                onChange={(e) => setLessonContent(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 resize-none focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Learning Goal</label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Students should understand the laws and solve conceptual plus numerical problems."
                                value={learningGoal}
                                onChange={(e) => setLearningGoal(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 resize-none focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Periods per Day</label>
                            <input
                                type="number"
                                min="1"
                                value={periodsPerDay}
                                onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
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
                                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-500"
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
                                                ? "bg-blue-600 text-white border-blue-600"
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
                        className="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        {loading ? "Generating..." : "Generate Lesson Plan"}
                    </button>
                </div>

                {!generatedPlan ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
                        <CalendarDays className="w-14 h-14 text-blue-400 mx-auto mb-4" />
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
                                                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
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
                                                <LinkIcon className="w-4 h-4 text-blue-600" />
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
                                                        className="text-blue-600 font-medium break-all"
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
                                                <CircleHelp className="w-4 h-4 text-blue-600" />
                                                Topic-wise Practice Questions
                                            </h5>
                                            <div className="space-y-3">
                                                {topic.practiceQuestions?.map((q, qIndex) => (
                                                    <div key={qIndex} className="bg-slate-50 rounded-xl p-4">
                                                        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-1">
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
                                <div className="space-y-6">
                                    {/* Revision Plan */}
                                    <div className="border-l-4 border-blue-500 pl-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">📚 Revision Plan</h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {generatedPlan.revisionPlan?.overview || "Comprehensive review of all topics"}
                                        </p>
                                        <div className="bg-blue-50 rounded p-3 mb-3">
                                            <p className="text-xs font-semibold text-blue-900 mb-2">Review Strategy:</p>
                                            <p className="text-sm text-gray-700">{generatedPlan.revisionPlan?.reviewStrategy}</p>
                                        </div>
                                        {generatedPlan.revisionPlan?.topicsToReview && generatedPlan.revisionPlan.topicsToReview.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-700 mb-2">Topics to Review:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {generatedPlan.revisionPlan.topicsToReview.map((topic, idx) => (
                                                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Time Required:</span> {generatedPlan.revisionPlan?.timeRequired}
                                        </p>
                                    </div>

                                    {/* Buffer Plan */}
                                    <div className="border-l-4 border-amber-500 pl-4">
                                        <h4 className="font-semibold text-amber-700 mb-2">⚡ Buffer Plan (If Falling Behind)</h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {generatedPlan.bufferPlan?.overview || "Compressed alternative plan"}
                                        </p>
                                        <div className="bg-amber-50 rounded p-3 mb-3">
                                            <p className="text-xs font-semibold text-amber-900 mb-2">Compressed Strategy:</p>
                                            <p className="text-sm text-gray-700">{generatedPlan.bufferPlan?.compressedStrategy}</p>
                                        </div>
                                        {generatedPlan.bufferPlan?.prioritizedTopics && generatedPlan.bufferPlan.prioritizedTopics.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-700 mb-2">Prioritized Topics:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {generatedPlan.bufferPlan.prioritizedTopics.map((topic, idx) => (
                                                        <span key={idx} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-600 mb-3">
                                            <span className="font-semibold">Timeframe:</span> {generatedPlan.bufferPlan?.timeframe}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Alternative Activities:</span> {generatedPlan.bufferPlan?.alternativeActivities}
                                        </p>
                                    </div>

                                    {/* Fallback Plan */}
                                    <div className="border-l-4 border-gray-400 pl-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">🔄 Fallback Plan</h4>
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