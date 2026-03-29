import { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { LogOut, User } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const fullName = user?.fullName || user?.name || "User";
  const role = user?.role || "student";
  const studentId = user?.studentId;

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="fixed top-0 left-72 right-0 h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
        <h2 className="text-2xl font-semibold text-slate-900">
          {title || "Dashboard"}
        </h2>

        <div className="flex items-center gap-5 relative">
          <NotificationBell />

          <div
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {initials || "U"}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900">
                {fullName}
                {role === "student" && studentId && (
                  <span className="ml-2 text-xs text-blue-600">
                    ({studentId})
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 capitalize">{role}</p>
            </div>
          </div>

          {open && (
            <div className="absolute right-0 top-16 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="font-medium text-slate-900">{fullName}</p>
                <p className="text-sm text-slate-500 capitalize">{role}</p>

                {/* 👇 SHOW STUDENT ID ONLY FOR STUDENTS */}
                {role === "student" && studentId && (
                  <p className="text-xs text-blue-600 mt-1">
                    ID: {studentId}
                  </p>
                )}
              </div>

              <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2">
                <User size={16} />
                Profile
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-500 flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="ml-72 mt-20 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
