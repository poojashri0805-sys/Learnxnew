import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import useLeaderboard from "../../hooks/useLeaderboard";

const SORTS = ["Total Points", "Quiz Score", "Streak"];
const GRADES = ["Grade 10", "Grade 11", "Grade 12"];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPodiumHeight(rank) {
  if (rank === 1) return "h-40";
  if (rank === 2) return "h-28";
  return "h-24";
}

function getPodiumBorder(rank) {
  if (rank === 1) return "border-amber-300";
  if (rank === 2) return "border-slate-300";
  return "border-orange-300";
}

function getPodiumBg(rank) {
  if (rank === 1) return "bg-amber-50";
  if (rank === 2) return "bg-slate-50";
  return "bg-orange-50";
}

function MedalIcon({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return null;
}

export default function StudentLeaderboard() {
  const { user } = useAuth();

  const [sortBy, setSortBy] = useState("Total Points");
  const [selectedGrade, setSelectedGrade] = useState(
    user?.role === "student" ? user?.gradeClass || "Grade 10" : "Grade 10"
  );

  useEffect(() => {
    if (!user) return;
    if (user.role === "student") {
      setSelectedGrade(user.gradeClass || "Grade 10");
    } else if (!GRADES.includes(selectedGrade)) {
      setSelectedGrade("Grade 10");
    }
  }, [user]);

  const isTeacher = user?.role === "teacher";

  const params = useMemo(() => {
    const sortKey =
      sortBy === "Total Points"
        ? "points"
        : sortBy === "Quiz Score"
        ? "quiz"
        : "streak";

    const query = { sortBy: sortKey };
    if (isTeacher) {
      query.grade = selectedGrade;
    } else if (user?.gradeClass) {
      query.grade = user.gradeClass;
    }

    return query;
  }, [sortBy, selectedGrade, isTeacher, user?.gradeClass]);

  const { leaderboard = [], top3 = [], loading } = useLeaderboard(params);

  const currentUserId = user?._id || user?.id;
  const myName = user?.fullName || user?.name || "You";
  const myInitials = getInitials(myName);

  const topThree = useMemo(() => {
    const arr = Array.isArray(top3) ? top3 : [];
    return [arr[1], arr[0], arr[2]].filter(Boolean); // show 2nd, 1st, 3rd like the image
  }, [top3]);

  return (
    <DashboardLayout title="Subject Leaderboard">
      <div className="space-y-6">
        <div className="flex justify-center items-end gap-8 mt-8">
          {topThree.map((student) => {
            const rank = student.rank;
            const isMe = currentUserId && student.userId === currentUserId;

            return (
              <div key={student.userId} className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-slate-400" : "bg-orange-400"
                  }`}
                >
                  {getInitials(student.name)}
                </div>

                <div className="mt-2 text-center">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">#{rank}</p>
                </div>

                <div
                  className={`mt-4 w-24 border-2 ${getPodiumBorder(rank)} ${getPodiumBg(
                    rank
                  )} ${getPodiumHeight(rank)} flex flex-col items-center justify-start pt-3`}
                >
                  <MedalIcon rank={rank} />
                  {isMe && (
                    <div className="mt-2 text-[11px] rounded-full bg-indigo-600 text-white px-2 py-0.5">
                      You
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-slate-500 text-sm flex items-center gap-2">
            <span>☆</span>
            <span>Sort by:</span>
          </div>

          {SORTS.map((item) => (
            <button
              key={item}
              onClick={() => setSortBy(item)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                sortBy === item
                  ? "bg-violet-100 text-violet-600"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          ))}

          {isTeacher ? (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span>Grade</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm outline-none"
              >
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          ) : user?.gradeClass ? (
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
              Grade {user.gradeClass}
            </div>
          ) : null}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Rank</th>
                <th className="text-left px-4 py-3 font-semibold">Student</th>
                <th className="text-left px-4 py-3 font-semibold">Grade</th>
                <th className="text-left px-4 py-3 font-semibold">Quiz Score</th>
                <th className="text-left px-4 py-3 font-semibold">Streak</th>
                <th className="text-left px-4 py-3 font-semibold">Total Points</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No leaderboard data available
                  </td>
                </tr>
              ) : (
                leaderboard.map((student) => {
                  const isMe = currentUserId && student.userId === currentUserId;
                  const initials = getInitials(student.name);

                  return (
                    <tr
                      key={student.userId}
                      className={`border-t ${
                        isMe ? "bg-indigo-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-700">
                        #{student.rank}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-semibold">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              {student.name}
                              {isMe && (
                                <span className="text-[11px] rounded-full bg-indigo-600 text-white px-2 py-0.5">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.gradeClass || student.grade || "-"}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {student.quizScore || 0}%
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <span className="text-orange-500 mr-1">🔥</span>
                        {student.streak || 0} days
                      </td>

                      <td className="px-4 py-3 font-semibold text-orange-500">
                        {Number(student.points || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}