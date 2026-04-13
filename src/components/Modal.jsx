import { useState } from "react";

function Modal({ onClose, type, onAuthSuccess, onSwitchType }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const password = e.target.password.value;
    const username = e.target.username.value;

    if (type === "register") {
      const email = e.target.email.value;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });
      if (response.ok) {
        const loginResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const loginData = await loginResponse.json();
        onAuthSuccess(loginData.token, username, loginData.user_id);
      } else {
        const data = await response.json();
        setError(data.message || "Registration failed. Try a different username.");
      }
    }

    if (type === "login") {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const loginData = await response.json();
        onAuthSuccess(loginData.token, username, loginData.user_id);
      } else {
        setError("Invalid username or password.");
      }
    }

    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-xl font-bold text-white">
            {type === "register" ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {type === "register" ? "Start tracking your anime." : "Log in to your AniTrack account."}
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {type === "register" && (
            <input
              className="bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg outline-none w-full border border-transparent focus:border-green-500 transition-colors"
              type="email"
              name="email"
              placeholder="Email"
              required
            />
          )}
          <input
            className="bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg outline-none w-full border border-transparent focus:border-green-500 transition-colors"
            type="text"
            name="username"
            placeholder="Username"
            required
          />
          <input
            className="bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg outline-none w-full border border-transparent focus:border-green-500 transition-colors"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          {type === "register" && (
            <input
              className="bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg outline-none w-full border border-transparent focus:border-green-500 transition-colors"
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
            />
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg w-full mt-1 transition-colors"
          >
            {loading ? "..." : type === "register" ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="text-gray-500 text-xs text-center">
          {type === "register" ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={onSwitchType}
            className="cursor-pointer text-green-400 hover:text-green-300"
          >
            {type === "register" ? "Login" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Modal;
