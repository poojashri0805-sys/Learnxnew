import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState("student"); // ✅ ADD THIS

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
      const res = await api.post("/auth/login", {
        ...form,
        role, // ✅ SEND ROLE
      });

      login(res.data.token, res.data.user);

      // ✅ redirect based on role
      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
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
          <button className="px-5 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            Login
          </button>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-purple-600 text-white shadow-md"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* CARD */}
      <div className="flex justify-center items-center mt-10 px-4">
        <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-gray-100">

          {/* ICON */}
          <div className="flex justify-center mb-4 text-3xl text-purple-600">
            🎓
          </div>

          {/* TITLE */}
          <h1 className="text-2xl font-bold text-center mb-2">
            Welcome Back to LearnX
          </h1>

          <p className="text-gray-500 text-center mb-6">
            Sign in to your account to continue
          </p>

          {/* ERROR */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          {/* ROLE SWITCH */}
          <div className="bg-gray-100 rounded-xl flex mb-4 overflow-hidden">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-2 transition ${
                role === "student"
                  ? "bg-white shadow text-purple-600"
                  : "text-gray-600"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 transition ${
                role === "teacher"
                  ? "bg-white shadow text-purple-600"
                  : "text-gray-600"
              }`}
            >
              Teacher
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-sm font-medium block">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-lg shadow-purple-200 hover:bg-purple-700 transition disabled:opacity-70"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-600 font-semibold">
              Register here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}