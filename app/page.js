import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";

export const dynamic = "force-dynamic";

const statusColors = {
  upcoming: "bg-blue/20 text-blue",
  "registration-closed": "bg-yellow-500/20 text-yellow-400",
  ongoing: "bg-neon/20 text-neon",
  completed: "bg-muted/20 text-muted",
};

export default async function HomePage() {
  await connectDB();
  const tournaments = await Tournament.find().sort({ startDate: 1 }).lean();

  const withCounts = await Promise.all(
    tournaments.map(async (t) => {
      const count = await Registration.countDocuments({
        tournamentId: t._id,
        status: { $ne: "rejected" },
      });
      return { ...t, registeredCount: count };
    })
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <section className="text-center mb-14">
        <h1 className="heading text-4xl md:text-5xl font-bold mb-3">
          Compete. Win. <span className="text-neon">Become a Legend.</span>
        </h1>
        <p className="text-muted max-w-xl mx-auto">
          Register for eFootball tournaments, track your bracket, and battle
          your way to the top.
        </p>
      </section>

      <section>
        <h2 className="heading text-2xl font-semibold mb-6">
          Tournaments
        </h2>
        {withCounts.length === 0 && (
          <p className="text-muted">No tournaments yet. Check back soon.</p>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {withCounts.map((t) => (
            <a
              key={t._id}
              href={`/tournaments/${t._id}`}
              className="card p-5 hover:border-neon transition block"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`badge ${statusColors[t.status] || ""}`}
                >
                  {t.status.replace("-", " ")}
                </span>
                <span className="text-xs text-muted">
                  {new Date(t.startDate).toLocaleDateString()}
                </span>
              </div>
              <h3 className="heading text-xl font-bold mb-1">{t.name}</h3>
              <p className="text-sm text-muted mb-4 line-clamp-2">
                {t.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue">
                  {t.registeredCount}/{t.maxSlots} slots filled
                </span>
                <span className="text-neon font-semibold">View →</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
