import { useEffect, useState } from "react";
import { BASE_SCORES, card, btn } from "./data.js";

const API = "http://localhost:4000";
const USER_ID = "demo-officer-1";

export default function Dashboard({ overrides, improved, onStartQuiz }) {
  const [profile, setProfile] = useState(null);
  const [recs, setRecs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const quizAnswers = { ...BASE_SCORES, ...overrides };
        const res = await fetch(`${API}/assess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: USER_ID, role: "Statistical Officer", quizAnswers }),
        });
        setProfile(await res.json());
        const r = await fetch(`${API}/recommend/${USER_ID}`);
        setRecs((await r.json()).recommended || []);
      } catch {
        setError("Can't reach the backend on port 4000. Start it with npm start in the backend folder.");
      }
    })();
  }, [JSON.stringify(overrides)]);

  if (error) return <p className="text-rose-300">{error}</p>;
  if (!profile) return <p className="text-slate-400">Loading competency profile…</p>;

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-1">Welcome, Officer</h1>
      <p className="text-slate-400 mb-6">Your competency profile for the Statistical Officer role.</p>

      {improved && improved.to > improved.from && (
        <div className="mb-6 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {improved.skill} improved from {Math.round(improved.from * 100)}% to {Math.round(improved.to * 100)}% after your last assessment.
        </div>
      )}

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-5 mb-6">
        <section className={`${card} p-6`}>
          <h2 className="font-semibold mb-4">Competency status</h2>
          {Object.entries(profile.competencyStatus).map(([skill, score]) => (
            <div key={skill} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{skill}</span>
                <span className={score >= 0.7 ? "text-emerald-300" : "text-amber-300"}>{Math.round(score * 100)}%</span>
              </div>
              <div className="h-1.5 rounded bg-[#1b2238] overflow-hidden">
                <div className={`h-full rounded ${score >= 0.7 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${score * 100}%` }} />
              </div>
            </div>
          ))}
        </section>
        <section className={`${card} p-6`}>
          <h2 className="font-semibold mb-4">Gaps to close</h2>
          {profile.gaps.length === 0 ? (
            <p className="text-sm text-emerald-300">No gaps. Every competency meets the bar.</p>
          ) : (
            profile.gaps.map((g) => (
              <div key={g} className="text-sm border-l-4 border-amber-400 bg-amber-400/10 px-3 py-2 mb-2">{g}</div>
            ))
          )}
        </section>
      </div>

      <section className={`${card} p-6 mb-8`}>
        <h2 className="font-semibold mb-3">Recommended courses from iGOT Karmayogi</h2>
        {recs.length === 0 && <p className="text-sm text-slate-400">Nothing to recommend right now.</p>}
        {recs.map(({ gap, courses }) =>
          courses.map((c) => (
            <div key={c.id} className="flex justify-between gap-4 py-3 border-t border-[#1b2238] first:border-0 text-sm">
              <span>{c.title}<br /><span className="text-slate-500">Closes: {gap}</span></span>
              <span className="text-slate-400 whitespace-nowrap">{c.duration_hrs} hrs</span>
            </div>
          ))
        )}
      </section>
      <button onClick={onStartQuiz} className={btn}>Upload material and generate a quiz</button>
    </div>
  );
}
