"use client";

import { useEffect, useState } from "react";

const statusColors = {
  upcoming: "bg-blue/20 text-blue",
  "registration-closed": "bg-yellow-500/20 text-yellow-400",
  ongoing: "bg-neon/20 text-neon",
  completed: "bg-muted/20 text-muted",
};

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    maxSlots: 16,
    startDate: "",
    format: "single-elimination",
    numGroups: 2,
    qualifiersPerGroup: 2,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/tournaments");
    const data = await res.json();
    setTournaments(data.tournaments || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTournament(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Failed to create tournament");
      return;
    }
    setForm({
      name: "",
      description: "",
      maxSlots: 16,
      startDate: "",
      format: "single-elimination",
      numGroups: 2,
      qualifiersPerGroup: 2,
    });
    load();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="heading text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="text-sm text-muted hover:text-red-400 transition"
        >
          Logout
        </button>
      </div>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="heading text-xl font-semibold mb-4">
            New Tournament
          </h2>
          <form onSubmit={createTournament} className="card p-5 space-y-3">
            <div>
              <label className="text-sm text-muted block mb-1">Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">
                Description
              </label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">
                Max Slots
              </label>
              <input
                type="number"
                className="input"
                min={2}
                value={form.maxSlots}
                onChange={(e) =>
                  setForm({ ...form, maxSlots: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Format</label>
              <select
                className="input"
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
              >
                <option value="single-elimination">
                  Single Elimination
                </option>
                <option value="group-knockout">
                  Group Stage + Knockout
                </option>
              </select>
            </div>
            {form.format === "group-knockout" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted block mb-1">
                    Number of Groups
                  </label>
                  <input
                    type="number"
                    className="input"
                    min={2}
                    value={form.numGroups}
                    onChange={(e) =>
                      setForm({ ...form, numGroups: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">
                    Qualifiers / Group
                  </label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={form.qualifiersPerGroup}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        qualifiersPerGroup: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-muted block mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                className="input"
                required
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              disabled={creating}
              className="glow-btn w-full py-2.5 rounded-lg"
            >
              {creating ? "Creating..." : "Create Tournament"}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <h2 className="heading text-xl font-semibold mb-4">
            All Tournaments
          </h2>
          <div className="space-y-3">
            {tournaments.length === 0 && (
              <p className="text-muted">No tournaments created yet.</p>
            )}
            {tournaments.map((t) => (
              <a
                key={t._id}
                href={`/admin/tournaments/${t._id}`}
                className="card p-4 flex items-center justify-between hover:border-neon transition block"
              >
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(t.startDate).toLocaleString()} · Max{" "}
                    {t.maxSlots} slots
                  </p>
                </div>
                <span className={`badge ${statusColors[t.status] || ""}`}>
                  {t.status.replace("-", " ")}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
