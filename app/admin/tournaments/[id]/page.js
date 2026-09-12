"use client";

import { useEffect, useState } from "react";
import Bracket from "@/components/Bracket";
import GroupStage from "@/components/GroupStage";

const statusBadge = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-neon/20 text-neon",
  rejected: "bg-red-500/20 text-red-400",
};

export default function ManageTournamentPage({ params }) {
  const { id } = params;
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [tRes, rRes] = await Promise.all([
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/admin/registrations?tournamentId=${id}`),
    ]);
    const tData = await tRes.json();
    const rData = await rRes.json();
    setTournament(tData.tournament);
    setMatches(tData.matches || []);
    setRegistrations(rData.registrations || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function setRegStatus(regId, status) {
    await fetch(`/api/admin/registrations/${regId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function runAction(url) {
    setBusy(true);
    setActionError("");
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setActionError(data.error || "Action failed");
      return;
    }
    load();
  }

  async function submitScore(matchId, score1, score2, screenshot) {
    await fetch(`/api/admin/match/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score1, score2, screenshot }),
    });
    load();
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }
  if (!tournament) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-muted">Tournament not found.</p>
      </main>
    );
  }

  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const isGroupFormat = tournament.format === "group-knockout";
  const groupMatches = matches.filter((m) => m.stage === "group");
  const knockoutMatches = matches.filter((m) => m.stage === "knockout");

  const registrationsTable = (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-card2">
            <th className="p-3">Team</th>
            <th className="p-3">Player</th>
            <th className="p-3">eFootball ID</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => (
            <tr key={r._id} className="border-b border-card2/50">
              <td className="p-3">{r.teamName}</td>
              <td className="p-3">{r.playerName}</td>
              <td className="p-3">{r.efootballId}</td>
              <td className="p-3 text-muted">
                {r.email}
                <br />
                {r.phone}
              </td>
              <td className="p-3">
                <span className={`badge ${statusBadge[r.status]}`}>
                  {r.status}
                </span>
              </td>
              <td className="p-3 space-x-2">
                {r.status !== "approved" && (
                  <button
                    onClick={() => setRegStatus(r._id, "approved")}
                    className="text-neon text-xs hover:underline"
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => setRegStatus(r._id, "rejected")}
                    className="text-red-400 text-xs hover:underline"
                  >
                    Reject
                  </button>
                )}
              </td>
            </tr>
          ))}
          {registrations.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-muted text-center">
                No registrations yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <a href="/admin/dashboard" className="text-sm text-muted hover:text-neon">
        ← Back to dashboard
      </a>
      <div className="flex items-center justify-between mt-3 mb-8">
        <h1 className="heading text-3xl font-bold">{tournament.name}</h1>
        <span className="badge bg-blue/20 text-blue">
          {isGroupFormat ? "Group Stage + Knockout" : "Single Elimination"}
        </span>
      </div>

      {/* SINGLE ELIMINATION FLOW */}
      {!isGroupFormat && !tournament.bracketGenerated && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="heading text-xl font-semibold">
              Registrations ({registrations.length})
            </h2>
            <div className="text-right">
              <button
                onClick={() => runAction(`/api/admin/bracket/${id}`)}
                disabled={busy || approvedCount < 2}
                className="glow-btn px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "Generating..." : `Generate Bracket (${approvedCount} approved)`}
              </button>
              {actionError && (
                <p className="text-red-400 text-xs mt-1">{actionError}</p>
              )}
            </div>
          </div>
          {registrationsTable}
        </section>
      )}
      {!isGroupFormat && tournament.bracketGenerated && (
        <section>
          <h2 className="heading text-xl font-semibold mb-6">
            Bracket — enter scores to auto-advance winners
          </h2>
          <Bracket matches={knockoutMatches} isAdmin onScoreSubmit={submitScore} />
        </section>
      )}

      {/* GROUP + KNOCKOUT FLOW */}
      {isGroupFormat && !tournament.groupsGenerated && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="heading text-xl font-semibold">
              Registrations ({registrations.length})
            </h2>
            <div className="text-right">
              <button
                onClick={() => runAction(`/api/admin/groups/${id}`)}
                disabled={busy || approvedCount < tournament.numGroups * 2}
                className="glow-btn px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy
                  ? "Generating..."
                  : `Generate ${tournament.numGroups} Groups & Fixtures (${approvedCount} approved)`}
              </button>
              {actionError && (
                <p className="text-red-400 text-xs mt-1">{actionError}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted mb-4">
            Needs at least {tournament.numGroups * 2} approved players (2 per
            group). Top {tournament.qualifiersPerGroup} from each group will
            advance to the knockout stage.
          </p>
          {registrationsTable}
        </section>
      )}

      {isGroupFormat && tournament.groupsGenerated && !tournament.bracketGenerated && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <h2 className="heading text-xl font-semibold">
              Group Stage — enter scores below
            </h2>
            <div className="text-right">
              <button
                onClick={() => runAction(`/api/admin/knockout/${id}`)}
                disabled={busy}
                className="glow-btn px-4 py-2 rounded-lg disabled:opacity-40"
              >
                {busy ? "Generating..." : "Generate Knockout Bracket"}
              </button>
              {actionError && (
                <p className="text-red-400 text-xs mt-1">{actionError}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted mb-6">
            Top {tournament.qualifiersPerGroup} from each group will be seeded
            into the knockout bracket. You can generate the bracket any time —
            groups with unfinished matches will just qualify their current
            leaders.
          </p>
          <GroupStage
            matches={groupMatches}
            isAdmin
            onScoreSubmit={submitScore}
          />
        </section>
      )}

      {isGroupFormat && tournament.bracketGenerated && (
        <section className="space-y-10">
          <div>
            <h2 className="heading text-xl font-semibold mb-4">
              Group Stage Results
            </h2>
            <GroupStage matches={groupMatches} isAdmin={false} />
          </div>
          <div>
            <h2 className="heading text-xl font-semibold mb-6">
              Knockout Bracket — enter scores to auto-advance winners
            </h2>
            <Bracket
              matches={knockoutMatches}
              isAdmin
              onScoreSubmit={submitScore}
            />
          </div>
        </section>
      )}
    </main>
  );
}
