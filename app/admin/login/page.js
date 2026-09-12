"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-20">
      <h1 className="heading text-2xl font-bold mb-6 text-center">
        Admin Login
      </h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="text-sm text-muted block mb-1">Email</label>
          <input
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted block mb-1">Password</label>
          <input
            type="password"
            className="input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="glow-btn w-full py-2.5 rounded-lg"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
