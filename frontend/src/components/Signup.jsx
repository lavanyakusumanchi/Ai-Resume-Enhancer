import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Signup({ onSwitchToLogin, darkMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const result = await signup(email, password, name);
    if (!result.success) {
      setError(result.error);
    } else {
      // Signup successful, component will be unmounted
    }
    setLoading(false);
  };

  return (
    <div className={`w-full max-w-md ${darkMode ? "bg-gray-800" : "bg-white"} p-8 rounded-2xl shadow-lg transition-colors`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>
        ✨ Sign Up
      </h2>

      {error && (
        <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-red-900 border border-red-700" : "bg-red-50 border border-red-200"}`}>
          <p className={`text-sm ${darkMode ? "text-red-300" : "text-red-700"}`}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block mb-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode
                ? "bg-gray-700 text-gray-300 border-gray-600 placeholder-gray-500"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
            }`}
            placeholder="Your Name"
          />
        </div>

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
            minLength={6}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode
                ? "bg-gray-700 text-gray-300 border-gray-600 placeholder-gray-500"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
            }`}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className={`block mb-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
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
          {loading ? "Signing up..." : "🚀 Sign Up"}
        </button>
      </form>

      <div className={`mt-4 text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className={`font-semibold hover:underline ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

