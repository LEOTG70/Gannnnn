"use client";

import { useState } from "react";
import { computeStandings } from "@/lib/standings";

export default function GroupStage({ matches, isAdmin = false, onScoreSubmit }) {
  const groupNames = [...new Set(matches.map((m) => m.groupName))].sort();

  return (
    <div className="space-y-10">
      {groupNames.map((gName) => {
        const groupMatches = matches.filter((m) => m.groupName === gName);
        const standings = computeStandings(groupMatches);

        return (
          <div key={gName}>
            <h3 className="heading text-xl font-semibold mb-3">{gName}</h3>

            <div className="card overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-card2">
                    <th className="p-2">#</th>
                    <th className="p-2">Team</th>
                    <th className="p-2">P</th>
                    <th className="p-2">W</th>
                    <th className="p-2">D</th>
                    <th className="p-2">L</th>
                    <th className="p-2">GD</th>
                    <th className="p-2">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.regId} className="border-b border-card2/50">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 truncate max-w-[160px]">{s.name}</td>
                      <td className="p-2">{s.played}</td>
                      <td className="p-2">{s.won}</td>
                      <td className="p-2">{s.drawn}</td>
                      <td className="p-2">{s.lost}</td>
                      <td className="p-2">{s.gd}</td>
                      <td className="p-2 text-neon font-semibold">
                        {s.points}
                      </td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-3 text-muted text-center">
                        No fixtures yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {groupMatches
                .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex)
                .map((m) => (
                  <FixtureCard
                    key={m._id}
                    match={m}
                    isAdmin={isAdmin}
                    onScoreSubmit={onScoreSubmit}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FixtureCard({ match, isAdmin, onScoreSubmit }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const canScore = isAdmin && match.status === "pending";

  function handleSubmit(e) {
    e.preventDefault();
    const s1 = Number(e.target.score1.value);
    const s2 = Number(e.target.score2.value);
    setSubmitting(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onScoreSubmit(match._id, s1, s2, reader.result);
      reader.readAsDataURL(file);
    } else {
      onScoreSubmit(match._id, s1, s2, null);
    }
  }

  return (
    <div className="card p-3 text-sm">
      <p className="text-xs text-muted mb-1">Matchday {match.round}</p>
      <div className="flex items-center justify-between mb-1">
        <span className="truncate max-w-[140px]">{match.player1Name}</span>
        <span>{match.score1 ?? "-"}</span>
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="truncate max-w-[140px]">{match.player2Name}</span>
        <span>{match.score2 ?? "-"}</span>
      </div>

      {match.screenshot && (
        <a
          href={match.screenshot}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue underline inline-block mt-1"
        >
          📷 View proof
        </a>
      )}

      {canScore && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              name="score1"
              type="number"
              required
              className="input text-sm py-1"
              placeholder="P1"
            />
            <input
              name="score2"
              type="number"
              required
              className="input text-sm py-1"
              placeholder="P2"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-muted w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-card2 file:text-white"
          />
          <button
            disabled={submitting}
            className="glow-btn text-xs px-3 py-1.5 rounded-md w-full"
          >
            {submitting ? "Saving..." : "Save Result"}
          </button>
        </form>
      )}
    </div>
  );
}
