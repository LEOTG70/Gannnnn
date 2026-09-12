import Match from "@/models/Match";

export function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Creates a single-elimination knockout bracket (stage: "knockout") for a
 * tournament, given an ordered list of registration-like objects
 * ({ _id, teamName, playerName }). Handles byes automatically when the
 * player count isn't a power of 2, and auto-advances bye winners into
 * round 2 immediately.
 *
 * shuffleFirst: true  -> randomize `players` before seeding (used for a
 *   plain single-elimination tournament with no prior stage).
 * shuffleFirst: false -> use `players` in the order given (used after a
 *   group stage, where order already reflects group standings).
 */
export async function createKnockoutBracket({
  tournamentId,
  players,
  shuffleFirst = true,
}) {
  await Match.deleteMany({ tournamentId, stage: "knockout" });

  const ordered = shuffleFirst ? shuffleArray(players) : players;
  const slotCount = nextPowerOf2(ordered.length);
  const slots = [...ordered];
  while (slots.length < slotCount) slots.push(null);

  const round1 = [];
  for (let i = 0; i < slotCount / 2; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];
    const p1Name = p1 ? `${p1.teamName} (${p1.playerName})` : "BYE";
    const p2Name = p2 ? `${p2.teamName} (${p2.playerName})` : "BYE";
    round1.push({
      tournamentId,
      stage: "knockout",
      round: 1,
      matchIndex: i,
      player1RegId: p1 ? p1._id : null,
      player2RegId: p2 ? p2._id : null,
      player1Name: p1Name,
      player2Name: p2Name,
      status: !p1 || !p2 ? "bye" : "pending",
      winnerRegId: !p2 ? (p1 ? p1._id : null) : !p1 ? (p2 ? p2._id : null) : null,
      winnerName: !p2 ? (p1 ? p1Name : null) : !p1 ? (p2 ? p2Name : null) : null,
    });
  }
  const createdRound1 = await Match.insertMany(round1);

  let matchesInRound = slotCount / 4;
  let round = 2;
  const allCreated = [...createdRound1];
  while (matchesInRound >= 1) {
    const roundMatches = [];
    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        tournamentId,
        stage: "knockout",
        round,
        matchIndex: i,
        player1Name: "TBD",
        player2Name: "TBD",
        status: "pending",
      });
    }
    const created = await Match.insertMany(roundMatches);
    allCreated.push(...created);
    matchesInRound = Math.floor(matchesInRound / 2);
    round++;
  }

  for (const m of createdRound1) {
    if (m.status === "bye" && m.winnerRegId) {
      const nextIndex = Math.floor(m.matchIndex / 2);
      const nextMatch = allCreated.find(
        (x) => x.round === 2 && x.matchIndex === nextIndex
      );
      if (nextMatch) {
        const isFirstSlot = m.matchIndex % 2 === 0;
        await Match.findByIdAndUpdate(nextMatch._id, {
          [isFirstSlot ? "player1RegId" : "player2RegId"]: m.winnerRegId,
          [isFirstSlot ? "player1Name" : "player2Name"]: m.winnerName,
        });
      }
    }
  }

  return Match.find({ tournamentId, stage: "knockout" }).sort({
    round: 1,
    matchIndex: 1,
  });
}

/**
 * Standard "circle method" round robin. Returns fixtures across
 * (n-1) rounds (n = even count, padded with a null bye if odd).
 * teams: array of registration-like objects ({ _id, teamName, playerName }).
 */
export function generateRoundRobin(teams) {
  let list = [...teams];
  if (list.length % 2 !== 0) list.push(null);
  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const fixtures = [];
  let arr = [...list];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home && away) fixtures.push({ round: r + 1, home, away });
    }
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  return fixtures;
}
