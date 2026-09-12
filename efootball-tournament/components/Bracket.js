"use client";

import { useState } from "react";

export default function Bracket({ matches, isAdmin = false, onScoreSubmit }) {
  const rounds = {};
  matches.forEach((m) => {
    rounds[m.round] = rounds[m.round] || [];
    rounds[m.round].push(m);
  });
  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  function roundLabel(roundNum, totalRounds) {
    const fromEnd = totalRounds - roundNum;
    if (fromEnd === 0) return "Final";
    if (fromEnd === 1) return "Semifinal";
    if (fromEnd === 2) return "Quarterfinal";
    return `Round ${roundNum}`;
  }

  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {roundNumbers.map((r) => (
        <div key={r} className="flex flex-col justify-around gap-6 min-w-[240px]">
          <h4 className="heading text-center text-blue font-semibold mb-2">
            {roundLabel(r, roundNumbers.length)}
          </h4>
          {rounds[r]
            .sort((a, b) => a.matchIndex - b.matchIndex)
            .map((m) => (
              <MatchCard
                key={m._id}
                match={m}
                isAdmin={isAdmin}
                onScoreSubmit={onScoreSubmit}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match, isAdmin, onScoreSubmit }) {
  const canScore =
    isAdmin &&
    match.status === "pending" &&
    match.player1Name !== "TBD" &&
    match.player2Name !== "TBD";

  return (
    <div className="card p-3">
      <PlayerRow
        name={match.player1Name}
        score={match.score1}
        won={match.winnerName === match.player1Name}
      />
      <div className="h-px bg-card2 my-1" />
      <PlayerRow
        name={match.player2Name}
        score={match.score2}
        won={match.winnerName === match.player2Name}
      />
      {match.screenshot && (
        <a
          href={match.screenshot}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue underline inline-block mt-2"
        >
          📷 View proof
        </a>
      )}
      {canScore && <ScoreForm matchId={match._id} onSubmit={onScoreSubmit} />}
      {match.status === "bye" && (
        <p className="text-xs text-muted mt-2">Auto-advanced (bye)</p>
      )}
    </div>
  );
}

function PlayerRow({ name, score, won }) {
  return (
    <div
      className={`flex items-center justify-between text-sm py-1 ${
        won ? "text-neon font-semibold" : "text-white"
      }`}
    >
      <span className="truncate max-w-[150px]">{name}</span>
      <span>{score !== null && score !== undefined ? score : "-"}</span>
    </div>
  );
}

function ScoreForm({ matchId, onSubmit }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const s1 = Number(e.target.score1.value);
    const s2 = Number(e.target.score2.value);
    setSubmitting(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onSubmit(matchId, s1, s2, reader.result);
      reader.readAsDataURL(file);
    } else {
      onSubmit(matchId, s1, s2, null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
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
  );
}
