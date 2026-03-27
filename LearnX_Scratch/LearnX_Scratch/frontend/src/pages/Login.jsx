import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState("student");

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
        role,
      });

      login(res.data.token, res.data.user);

      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-purple-600 font-bold text-2xl">
          <span className="text-3xl">🎓</span>
          <span>LearnX</span>
        </div>

        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-purple-200 transition-all font-medium text-gray-700">
            Login
          </button>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex justify-center items-center px-4 py-8">
        <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl border border-gray-100">
          {/* ICON */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🎓</span>
          </div>

          {/* TITLE */}
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
            Welcome Back
          </h1>

          <p className="text-gray-500 text-center mb-8">
            Sign in to your LearnX account to continue learning
          </p>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* ROLE SWITCH */}
          <div className="bg-gray-100 rounded-xl flex p-1 mb-6 overflow-hidden">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-2.5 rounded-lg transition-all font-semibold ${
                role === "student"
                  ? "bg-white shadow-md text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2.5 rounded-lg transition-all font-semibold ${
                role === "teacher"
                  ? "bg-white shadow-md text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Teacher
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold block text-gray-700 mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold block text-gray-700 mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm mt-6 text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-purple-600 font-bold hover:text-purple-700 transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}