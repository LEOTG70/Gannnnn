import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";
import Match from "@/models/Match";
import RegisterForm from "@/components/RegisterForm";
import Bracket from "@/components/Bracket";
import GroupStage from "@/components/GroupStage";

export const dynamic = "force-dynamic";

export default async function TournamentPage({ params }) {
  await connectDB();
  const tournament = await Tournament.findById(params.id).lean();

  if (!tournament) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-muted">Tournament not found.</p>
      </main>
    );
  }

  const registeredCount = await Registration.countDocuments({
    tournamentId: params.id,
    status: { $ne: "rejected" },
  });

  const allMatches = await Match.find({ tournamentId: params.id })
    .sort({ groupName: 1, round: 1, matchIndex: 1 })
    .lean();
  const groupMatches = allMatches.filter((m) => m.stage === "group");
  const knockoutMatches = allMatches.filter((m) => m.stage === "knockout");

  const isFull = registeredCount >= tournament.maxSlots;
  const canRegister = tournament.status === "upcoming" && !isFull;
  const stageStarted = tournament.groupsGenerated || tournament.bracketGenerated;
  const isGroupFormat = tournament.format === "group-knockout";

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="card p-6 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="heading text-3xl font-bold">{tournament.name}</h1>
          <span className="badge bg-blue/20 text-blue">
            {tournament.status.replace("-", " ")}
          </span>
        </div>
        <p className="text-muted mb-4">
          {tournament.description || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted">Starts: </span>
            {new Date(tournament.startDate).toLocaleString()}
          </div>
          <div>
            <span className="text-muted">Slots: </span>
            <span className="text-neon font-semibold">
              {registeredCount}/{tournament.maxSlots}
            </span>
          </div>
          <div>
            <span className="text-muted">Format: </span>
            {isGroupFormat
              ? `${tournament.numGroups} Groups + Knockout`
              : "Single Elimination"}
          </div>
        </div>
      </div>

      {!stageStarted ? (
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="heading text-2xl font-semibold mb-4">Register</h2>
            {canRegister ? (
              <RegisterForm tournamentId={tournament._id.toString()} />
            ) : (
              <div className="card p-6 text-muted">
                {isFull
                  ? "This tournament is full."
                  : "Registration is closed for this tournament."}
              </div>
            )}
          </div>
          <div className="card p-6 h-fit">
            <h3 className="heading text-lg font-semibold mb-2">
              How it works
            </h3>
            <ol className="list-decimal list-inside text-sm text-muted space-y-2">
              <li>Fill in your team name, player name, and eFootball ID.</li>
              <li>Wait for the admin to approve your registration.</li>
              {isGroupFormat ? (
                <>
                  <li>
                    Once enough players are approved, groups and round-robin
                    fixtures are generated automatically.
                  </li>
                  <li>
                    Top {tournament.qualifiersPerGroup} from each group
                    advance to an automatically-seeded knockout bracket.
                  </li>
                </>
              ) : (
                <li>
                  Once slots fill or the admin closes registration, the
                  bracket is generated automatically.
                </li>
              )}
              <li>Check back here to see your matches and results.</li>
            </ol>
          </div>
        </section>
      ) : (
        <div className="space-y-12">
          {groupMatches.length > 0 && (
            <section>
              <h2 className="heading text-2xl font-semibold mb-6">
                Group Stage
              </h2>
              <GroupStage matches={groupMatches} />
            </section>
          )}
          {knockoutMatches.length > 0 && (
            <section>
              <h2 className="heading text-2xl font-semibold mb-6">
                Knockout Bracket
              </h2>
              <Bracket matches={knockoutMatches} />
            </section>
          )}
        </div>
      )}
    </main>
  );
}
