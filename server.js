const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const competencies = JSON.parse(fs.readFileSync(path.join(__dirname, "data/competencies.json")));
const courses = JSON.parse(fs.readFileSync(path.join(__dirname, "data/courses.json")));

// In-memory store for demo purposes (swap for Postgres later)
const profiles = {};

// POST /assess
// body: { userId, role, quizAnswers: { "Sampling Theory": 0.4, "Data Governance": 0.9, ... } }
// scores are 0-1 accuracy per competency from a diagnostic quiz
app.post("/assess", (req, res) => {
  const { userId, role, quizAnswers } = req.body;
  const requiredSkills = competencies[role];
  if (!requiredSkills) {
    return res.status(400).json({ error: `Unknown role "${role}"` });
  }

  const THRESHOLD = 0.7;
  const gaps = requiredSkills.filter((skill) => (quizAnswers[skill] ?? 0) < THRESHOLD);
  const strong = requiredSkills.filter((skill) => (quizAnswers[skill] ?? 0) >= THRESHOLD);

  profiles[userId] = { role, gaps, strong, quizAnswers, updatedAt: new Date().toISOString() };

  res.json({ userId, role, gaps, strong, competencyStatus: quizAnswers });
});

// GET /recommend/:userId
// matches this user's gaps to courses tagged with that skill
app.get("/recommend/:userId", (req, res) => {
  const profile = profiles[req.params.userId];
  if (!profile) return res.status(404).json({ error: "No assessment found for this user yet" });

  const recommended = profile.gaps.map((gap) => ({
    gap,
    courses: courses.filter((c) => c.skill === gap),
  }));

  res.json({ userId: req.params.userId, recommended });
});

// GET /profile/:userId
app.get("/profile/:userId", (req, res) => {
  const profile = profiles[req.params.userId];
  if (!profile) return res.status(404).json({ error: "No profile found" });
  res.json(profile);
});

// POST /progress  — call after a quiz is completed to update competency status
// body: { userId, skill, newScore }
app.post("/progress", (req, res) => {
  const { userId, skill, newScore } = req.body;
  const profile = profiles[userId];
  if (!profile) return res.status(404).json({ error: "No profile found" });

  profile.quizAnswers[skill] = newScore;
  profile.gaps = profile.gaps.filter((g) => g !== skill || newScore < 0.7);
  profile.updatedAt = new Date().toISOString();

  res.json(profile);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`ANTARA backend running on http://localhost:${PORT}`));
