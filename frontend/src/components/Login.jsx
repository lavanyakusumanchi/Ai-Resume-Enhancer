import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login({ onSwitchToSignup, darkMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    } else {
      // Login successful, component will be unmounted
    }
    setLoading(false);
  };

  return (
    <div className={`w-full max-w-md ${darkMode ? "bg-gray-800" : "bg-white"} p-8 rounded-2xl shadow-lg transition-colors`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>
        🔐 Login
      </h2>

      {error && (
        <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-red-900 border border-red-700" : "bg-red-50 border border-red-200"}`}>
          <p className={`text-sm ${darkMode ? "text-red-300" : "text-red-700"}`}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block mb-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode
                ? "bg-gray-700 text-gray-300 border-gray-600 placeholder-gray-500"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
            }`}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className={`block mb-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode
                ? "bg-gray-700 text-gray-300 border-gray-600 placeholder-gray-500"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
            }`}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
            loading
              ? darkMode
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              : darkMode
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {loading ? "Logging in..." : "🚀 Login"}
        </button>
      </form>

      <div className={`mt-4 text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            className={`font-semibold hover:underline ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

