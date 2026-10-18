# ANTARA — AI Competency Intelligence Platform (SIH26101 prototype)

Three services, run separately. Open **three separate terminal (PowerShell) windows**
and leave all three running at the same time — don't close or reuse any of them.

## 0. Windows PowerShell setup (do this once)

If `npm` or venv activation gets blocked by a script-execution error, run this
**once**, in an Administrator PowerShell window:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Then close and reopen your terminals.

## 1. Backend (Node/Express) — competency + recommendation logic

```powershell
cd antara\backend
npm install
npm start
```
Runs on http://localhost:4000

## 2. AI Service (Python/FastAPI) — MCQ generation via Groq

```powershell
cd antara\ai-service
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:GROQ_API_KEY="your_actual_key_here"
uvicorn main:app --reload --port 8000
```
Runs on http://localhost:8000
Get a free API key at https://console.groq.com/keys (no card required)

**Sanity check before moving on:** in a *second* terminal window, run:
```powershell
curl http://127.0.0.1:8000/health
```
It should return `StatusCode: 200` with `{"status":"ok"}`. If it hangs or fails,
run `netstat -ano | findstr :8000` — if you see more than one PID listed, kill the
old ones with `taskkill /F /PID <pid>` and restart uvicorn fresh. Duplicate
leftover processes from repeated restarts are the most common cause of a hang.

## 3. Frontend (React/Vite/Tailwind)

```powershell
cd antara\frontend
npm install
npm run dev
```
Opens on http://localhost:5173 — this is the one you open in your browser.

## Demo flow to record for the YouTube submission

1. Dashboard loads → shows mock competency scores and flags 2 gaps (Sampling Theory, National Accounts)
2. Recommended iGOT courses appear for each gap
3. Click "Upload Material & Generate Quiz" → upload `sample-training-material.txt` (or any PDF)
4. Quiz screen opens → webcam preview appears top-right (live screening) → switch tabs once to show a flag get logged
5. Answer questions → Submit → see score + integrity flag count
6. Back to Dashboard — mention in voiceover that progress would now feed back into the competency profile

## What's mocked vs. real for this prototype

- **Real**: MCQ generation (actual Groq LLM call, grounded in your uploaded document), webcam live screening, tab-switch detection, gap-scoring logic
- **Mocked**: the diagnostic quiz answers on the dashboard (hardcoded in `Dashboard.jsx`), the iGOT course catalog (`backend/data/courses.json` — structured to match iGOT's real schema so swapping in the live API later is a config change)

## Common Windows gotchas (already fixed in this version, kept here for reference)

- **`npm : running scripts is disabled`** → use `npm.cmd install` / `npm.cmd run dev`, or fix permanently with the `Set-ExecutionPolicy` command above
- **`venv could not be loaded`** → you're not inside the `ai-service` folder; `cd` there first
- **`uvicorn not recognized`** → venv isn't activated; run `venv\Scripts\Activate.ps1` first, confirm `(venv)` shows in the prompt
- **`ModuleNotFoundError: No module named 'openai'`** → `pip install openai` was run outside the venv; activate venv first, then install
- **Everything hangs with no response** → check for duplicate processes: `netstat -ano | findstr :8000`, kill extras with `taskkill /F /PID <pid>`

## Latest frontend update

- Dark theme and a four-stage strip (Learn, Assess, Understand, Improve) at the top of every screen
- Pick which skill an uploaded document covers; finishing the quiz raises that skill's score and recomputes gaps and course recommendations through the backend
- After the quiz, review every question with your answer, the correct answer and the explanation
