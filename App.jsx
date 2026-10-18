import { useState } from "react";
import Dashboard from "./Dashboard.jsx";
import UploadQuiz from "./UploadQuiz.jsx";
import QuizScreen from "./QuizScreen.jsx";
import { BASE_SCORES, card, btn } from "./data.js";

const STAGES = ["Learn", "Assess", "Understand", "Improve"];

function Result({ result, onHome }) {
  const pct = Math.round(result.score * 100);
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold mb-2">Assessment complete</h1>
      <p className="text-slate-400 mb-6">
        {pct}% correct. {result.flagCount > 0 ? `${result.flagCount} integrity flag(s) raised during the session.` : "No integrity flags raised."}
      </p>
      {result.questions.map((q, i) => {
        const picked = result.answers[i];
        const ok = picked === q.correct_index;
        return (
          <div key={i} className={`${card} p-5 mb-3 border-l-4 ${ok ? "border-l-emerald-400" : "border-l-rose-400"}`}>
            <p className="font-medium mb-2">{i + 1}. {q.question}</p>
            <p className="text-sm text-slate-400">
              Your answer: <span className={ok ? "text-emerald-300" : "text-rose-300"}>{picked === undefined ? "Not answered" : q.options[picked]}</span>
            </p>
            {!ok && <p className="text-sm text-slate-400">Correct answer: <span className="text-emerald-300">{q.options[q.correct_index]}</span></p>}
            {q.explanation && <p className="text-sm text-slate-500 mt-2">{q.explanation}</p>}
          </div>
        );
      })}
      <button onClick={onHome} className={`${btn} mt-4`}>See my updated dashboard</button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [questions, setQuestions] = useState([]);
  const [skill, setSkill] = useState("Sampling Theory");
  const [result, setResult] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [improved, setImproved] = useState(null);

  const stage = screen === "result" ? 2 : screen === "dashboard" ? (improved ? 3 : 0) : 1;

  function finish(r) {
    const from = overrides[skill] ?? BASE_SCORES[skill];
    const to = Math.max(from, r.score);
    setOverrides((o) => ({ ...o, [skill]: to }));
    setImproved({ skill, from, to });
    setResult(r);
    setScreen("result");
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-6 pt-7 pb-2 flex flex-wrap items-baseline justify-between gap-4">
        <span className="text-2xl font-light tracking-[0.35em]">ANTARA</span>
        <nav className="flex gap-1 text-sm">
          {STAGES.map((s, i) => (
            <span key={s} className={`px-3 py-1 rounded-full ${i === stage ? "bg-sky-300 text-slate-900 font-medium" : i < stage ? "text-sky-300" : "text-slate-500"}`}>{s}</span>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 pb-16 pt-6">
        {screen === "dashboard" && <Dashboard overrides={overrides} improved={improved} onStartQuiz={() => setScreen("upload")} />}
        {screen === "upload" && (
          <UploadQuiz
            skill={skill}
            setSkill={setSkill}
            onBack={() => setScreen("dashboard")}
            onQuizGenerated={(qs) => { setQuestions(qs); setScreen("quiz"); }}
          />
        )}
        {screen === "quiz" && <QuizScreen questions={questions} onFinish={finish} />}
        {screen === "result" && <Result result={result} onHome={() => setScreen("dashboard")} />}
      </main>
    </div>
  );
}
