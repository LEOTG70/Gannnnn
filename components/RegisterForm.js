"use client";

import { useState } from "react";

export default function RegisterForm({ tournamentId }) {
  const [form, setForm] = useState({
    teamName: "",
    playerName: "",
    efootballId: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-6 border-neon">
        <p className="text-neon font-semibold mb-1">
          🎮 You're registered!
        </p>
        <p className="text-sm text-muted">
          Your registration is pending admin approval. Check back on this
          page for updates once the bracket is announced.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div>
        <label className="text-sm text-muted block mb-1">Team Name</label>
        <input
          className="input"
          required
          value={form.teamName}
          onChange={(e) => update("teamName", e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-muted block mb-1">Player Name</label>
        <input
          className="input"
          required
          value={form.playerName}
          onChange={(e) => update("playerName", e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-muted block mb-1">
          eFootball ID
        </label>
        <input
          className="input"
          required
          value={form.efootballId}
          onChange={(e) => update("efootballId", e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-muted block mb-1">Email</label>
        <input
          type="email"
          className="input"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-muted block mb-1">Phone</label>
        <input
          className="input"
          required
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="glow-btn w-full py-2.5 rounded-lg"
      >
        {status === "loading" ? "Registering..." : "Register Now"}
      </button>
    </form>
  );
}
