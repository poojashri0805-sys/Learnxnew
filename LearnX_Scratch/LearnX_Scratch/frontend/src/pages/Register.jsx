import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    gradeClass: "",
    schoolName: "",
    subject: "",
    experience: "",
    institution: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", {
        ...form,
        role,
      });

      login(res.data.token, res.data.user);
      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-emerald-50">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-2 text-purple-600 font-bold text-2xl">
          🎓 LearnX
        </div>

        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            Login
          </Link>
          <button className="px-5 py-2 rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-700 transition">
            Get Started
          </button>
        </div>
      </div>

      {/* CARD */}
      <div className="flex justify-center items-center mt-10 px-4 pb-10">
        <div className="bg-white w-full max-w-4xl p-10 rounded-3xl shadow-xl border border-gray-100">
          {/* ICON */}
          <div className="flex justify-center mb-4 text-3xl text-purple-600">
            🎓
          </div>

          {/* TITLE */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Join LearnX
          </h1>

          <p className="text-gray-500 text-center mb-6">
            Create your account to get started
          </p>

          {/* ROLE SWITCH */}
          <div className="bg-gray-100 rounded-xl flex mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2 transition ${
                role === "student"
                  ? "bg-white shadow text-purple-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 transition ${
                role === "teacher"
                  ? "bg-white shadow text-purple-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              Teacher
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block">Full Name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder={role === "teacher" ? "Dr. Jane Smith" : "John Doe"}
                  className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium block">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium block">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {role === "student" && (
                <>
                  <div>
                    <label className="text-sm font-medium block">
                      Grade/Class
                    </label>
                    <input
                      name="gradeClass"
                      value={form.gradeClass}
                      onChange={handleChange}
                      placeholder="e.g. Grade 10"
                      className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block">
                      School Name
                    </label>
                    <input
                      name="schoolName"
                      value={form.schoolName}
                      onChange={handleChange}
                      placeholder="Your school"
                      className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {role === "teacher" && (
                <>
                  <div>
                    <label className="text-sm font-medium block">Subject</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="e.g. Mathematics"
                      className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block">
                      Experience (years)
                    </label>
                    <input
                      name="experience"
                      type="number"
                      value={form.experience}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium block">
                      Institution Name
                    </label>
                    <input
                      name="institution"
                      value={form.institution}
                      onChange={handleChange}
                      placeholder="Your institution"
                      className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-lg shadow-purple-200 hover:bg-purple-700 transition disabled:opacity-70"
            >
              {loading
                ? "Creating Account..."
                : role === "teacher"
                ? "Create Teacher Account"
                : "Create Student Account"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}