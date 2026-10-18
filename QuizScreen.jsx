import { useEffect, useRef, useState } from "react";

export default function QuizScreen({ questions, onFinish }) {
  const videoRef = useRef(null);
  const [flagCount, setFlagCount] = useState(0);
  const [flagLog, setFlagLog] = useState([]);
  const [answers, setAnswers] = useState({});
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setCameraError("Camera unavailable — proceeding without live screening.");
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    function flag(reason) {
      setFlagCount((c) => c + 1);
      setFlagLog((log) => [...log, { reason, time: new Date().toLocaleTimeString() }]);
    }
    function handleVisibility() {
      if (document.hidden) flag("Tab switched / window minimized");
    }
    function handleBlur() {
      flag("Window lost focus");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  function selectAnswer(qIndex, optIndex) {
    setAnswers((a) => ({ ...a, [qIndex]: optIndex }));
  }

  function submit() {
    const correct = questions.filter((q, i) => answers[i] === q.correct_index).length;
    onFinish({ score: correct / questions.length, flagCount, flagLog, answers, questions });
  }

  return (
    <div>
      <div className="fixed top-4 right-4 w-44 bg-[#0d1120] border border-[#1b2238] rounded-xl p-2 z-50">
        <video ref={videoRef} autoPlay muted className="w-full rounded-lg bg-black" />
        <p className="text-xs mt-1 text-center">
          {cameraError ? <span className="text-slate-500">{cameraError}</span> : <span className={flagCount > 0 ? "text-amber-300" : "text-emerald-300"}>Live screening: {flagCount} flag{flagCount !== 1 ? "s" : ""}</span>}
        </p>
      </div>
      <h1 className="text-3xl font-semibold mb-6">Your assessment</h1>
      <div className="max-w-2xl">
        {questions.map((q, i) => (
          <div key={i} className="bg-[#0d1120] border border-[#1b2238] rounded-xl p-5 mb-4">
            <p className="font-medium mb-3">{i + 1}. {q.question}</p>
            {q.options.map((opt, j) => (
              <label key={j} className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-lg border mb-2 cursor-pointer ${answers[i] === j ? "border-sky-300 bg-sky-300/10" : "border-[#1b2238] hover:bg-white/5"}`}>
                <input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => selectAnswer(i, j)} className="accent-sky-300" />
                {opt}
              </label>
            ))}
          </div>
        ))}
        <button onClick={submit} className="bg-sky-300 text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-sky-200">Submit answers</button>
      </div>
    </div>
  );
}
