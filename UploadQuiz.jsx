import { useState, useEffect } from "react";
import { SKILLS, card, btn } from "./data.js";

const AI_API = "http://localhost:8000";

// Simple, transparent pricing model: a small base fee + a per-1000-word processing
// rate. This is a mock estimate for demo purposes — it is not a real billing charge.
const BASE_FEE = 2; // ₹
const RATE_PER_1000_WORDS = 6; // ₹

function estimateFromFile(file, text) {
  const kb = file.size / 1024;
  // .txt/.md: exact word count from real text. .pdf: rough estimate from file size
  // (avg ~5.8 bytes per word including spacing/PDF overhead).
  const words = text ? text.trim().split(/\s+/).filter(Boolean).length : Math.round(file.size / 5.8);
  const pages = Math.max(1, Math.round(words / 400));
  const cost = BASE_FEE + (words / 1000) * RATE_PER_1000_WORDS;
  return { kb: kb.toFixed(1), words, pages, cost: cost.toFixed(2), exact: !!text };
}

export default function UploadQuiz({ onQuizGenerated, skill, setSkill, onBack }) {
  const [file, setFile] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) {
      setEstimate(null);
      return;
    }
    if (file.name.toLowerCase().endsWith(".pdf")) {
      setEstimate(estimateFromFile(file, null));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setEstimate(estimateFromFile(file, e.target.result));
    reader.readAsText(file);
  }, [file]);

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${AI_API}/generate-quiz?num_questions=5`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const quiz = await res.json();
      onQuizGenerated(quiz.questions);
    } catch (err) {
      setError(`Quiz generation failed: ${err.message || "unknown error — check the AI service terminal"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-semibold mb-1">Turn training material into a quiz</h1>
      <p className="text-slate-400 mb-6">Upload a PDF, TXT or MD file. You will see the processing cost before anything runs.</p>
      <section className={`${card} p-6`}>
        <label className="block text-sm text-slate-400 mb-1" htmlFor="skill">This material covers</label>
        <select id="skill" value={skill} onChange={(e) => setSkill(e.target.value)} className="w-full mb-4 rounded-lg bg-[#060810] border border-[#1b2238] px-3 py-2">
          {SKILLS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="block border border-dashed border-[#2c3656] rounded-xl p-8 text-center cursor-pointer hover:border-sky-300 text-slate-400">
          <input type="file" accept=".pdf,.txt,.md" onChange={(e) => setFile(e.target.files[0])} className="sr-only" />
          {file ? file.name : "Choose a file, or drop one here"}
        </label>
        {estimate && (
          <div className="mt-5">
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div><b className="text-xl">{estimate.words.toLocaleString()}</b><p className="text-xs text-slate-500">words</p></div>
              <div><b className="text-xl">{estimate.pages}</b><p className="text-xs text-slate-500">pages</p></div>
              <div><b className="text-xl">{estimate.kb}</b><p className="text-xs text-slate-500">KB</p></div>
            </div>
            <div className="flex justify-between items-baseline border-t border-[#1b2238] pt-3">
              <span className="text-slate-300">Estimated processing cost</span>
              <b className="text-2xl text-sky-300">₹{estimate.cost}</b>
            </div>
            <p className="text-xs text-slate-500 mt-2">₹{BASE_FEE} base fee plus ₹{RATE_PER_1000_WORDS} per 1,000 words ({estimate.exact ? "exact count" : "estimated from file size"}).</p>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={handleGenerate} disabled={!file || loading} className={btn}>{loading ? "Generating quiz…" : "Generate quiz"}</button>
          <button onClick={onBack} className="px-5 py-3 rounded-lg border border-[#1b2238] text-slate-300 hover:bg-white/5">Back to dashboard</button>
        </div>
        {error && <p className="text-rose-300 text-sm mt-4">{error}</p>}
      </section>
    </div>
  );
}
