/**
 * Computes a group-stage standings table purely from a list of match
 * documents (stage: "group") for one group. Works both server-side
 * (mongoose lean() docs) and client-side (plain JSON from fetch) since it
 * only reads plain fields — no DB calls.
 *
 * Rules: win = 3 pts, draw = 1 pt, loss = 0. Sorted by points, then goal
 * difference, then goals scored.
 */
export function computeStandings(matches) {
  const table = {};

  const ensure = (regId, name) => {
    const key = String(regId);
    if (!table[key]) {
      table[key] = {
        regId: key,
        name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        points: 0,
      };
    }
    return table[key];
  };

  matches.forEach((m) => {
    if (!m.player1RegId || !m.player2RegId) return;
    const p1 = ensure(m.player1RegId, m.player1Name);
    const p2 = ensure(m.player2RegId, m.player2Name);
    if (m.status !== "completed") return;

    p1.played++;
    p2.played++;
    p1.gf += m.score1;
    p1.ga += m.score2;
    p2.gf += m.score2;
    p2.ga += m.score1;

    if (m.score1 > m.score2) {
      p1.won++;
      p1.points += 3;
      p2.lost++;
    } else if (m.score2 > m.score1) {
      p2.won++;
      p2.points += 3;
      p1.lost++;
    } else {
      p1.drawn++;
      p2.drawn++;
      p1.points++;
      p2.points++;
    }
  });

  return Object.values(table)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}
