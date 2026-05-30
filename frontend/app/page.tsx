"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000";

// ── helpers ──────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green:  "bg-green-900 text-green-300",
    blue:   "bg-blue-900 text-blue-300",
    yellow: "bg-yellow-900 text-yellow-300",
    orange: "bg-orange-900 text-orange-300",
    red:    "bg-red-900 text-red-300",
    gray:   "bg-gray-800 text-gray-300",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[color] ?? colors.gray}`}>
      {label}
    </span>
  );
}

// ── Module components ─────────────────────────────────────

function GymTrainer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Start your camera to begin");
  const [exercise, setExercise] = useState("squat");
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setRunning(true);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setFeedback("Camera stopped");
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(async () => {
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      if (!canvas || !video) return;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      try {
        const res = await axios.post(`${API}/gym-trainer/analyze-pose`, {
          image_base64: base64,
          exercise
        });
        setReps(res.data.reps);
        setFeedback(res.data.feedback);
      } catch {}
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, exercise]);

  const resetReps = async () => {
    await axios.post(`${API}/gym-trainer/reset?exercise=${exercise}`);
    setReps(0);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🏋️ AI Gym Trainer</h2>
        <Badge label="Module 1" color="blue" />
      </div>
      <div className="flex gap-2 mb-4">
        {["squat","curl","pushup"].map(ex => (
          <button key={ex}
            onClick={() => { setExercise(ex); setReps(0); }}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition ${
              exercise === ex
                ? "bg-blue-600 text-white"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]"
            }`}>
            {ex}
          </button>
        ))}
      </div>
      <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{height:220}}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            Camera off
          </div>
        )}
        <div className="absolute top-3 left-3 bg-black/70 rounded-xl px-4 py-2">
          <div className="text-xs text-gray-400 uppercase">{exercise}</div>
          <div className="text-4xl font-bold text-white">{reps}</div>
          <div className="text-xs text-gray-400">reps</div>
        </div>
      </div>
      <p className="text-sm text-blue-300 mb-4 bg-blue-950/40 rounded-lg px-3 py-2">{feedback}</p>
      <div className="flex gap-2">
        <button onClick={running ? stopCamera : startCamera}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            running ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          } text-white`}>
          {running ? "Stop Camera" : "Start Camera"}
        </button>
        <button onClick={resetReps}
          className="px-4 py-2 rounded-lg text-sm bg-[#2a2a2a] hover:bg-[#333] text-gray-300 transition">
          Reset
        </button>
      </div>
    </Card>
  );
}

function Dietician() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState("");
  const [sources, setSources]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<"ask"|"meal"|"grocery">("ask");

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const endpoint = mode === "ask" ? "/dietician/ask"
                     : mode === "meal" ? "/dietician/meal-plan"
                     : "/dietician/grocery-list";
      const res = await axios.post(`${API}${endpoint}`, {
        question,
        user_profile: { goal: "fitness", diet_type: "balanced" }
      });
      setAnswer(res.data.answer ?? res.data.meal_plan ?? res.data.grocery_list);
      setSources(res.data.sources ?? []);
    } catch (e: any) {
      setAnswer("Error: " + (e.response?.data?.detail ?? e.message));
    }
    setLoading(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🥗 AI Dietician</h2>
        <Badge label="Module 2" color="green" />
      </div>
      <div className="flex gap-2 mb-3">
        {(["ask","meal","grocery"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-lg text-xs capitalize transition ${
              mode === m ? "bg-green-600 text-white" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]"
            }`}>
            {m === "ask" ? "Ask" : m === "meal" ? "Meal Plan" : "Grocery List"}
          </button>
        ))}
      </div>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder={
          mode === "ask" ? "e.g. What should I eat before a workout?" :
          mode === "meal" ? "e.g. 1800 calorie high protein diet" :
          "e.g. Weekly groceries for muscle gain"
        }
        className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-200 resize-none mb-3 focus:outline-none focus:border-green-500"
        rows={2}
      />
      <button onClick={ask} disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 mb-3">
        {loading ? "Thinking..." : "Ask Dietician"}
      </button>
      {answer && (
        <div className="bg-[#111] rounded-xl p-3 text-sm text-gray-300 max-h-40 overflow-y-auto mb-2 whitespace-pre-wrap">
          {answer}
        </div>
      )}
      {sources.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Sources:</p>
          {sources.map((s, i) => (
            <div key={i} className="text-xs text-gray-500 bg-[#111] rounded px-2 py-1 mb-1">
              📄 {s.document} — p.{s.page}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function GymBuddy() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setLoading(true);
    setHistory(h => [...h, { role: "user", text: userMsg }]);
    try {
      const res = await axios.post(`${API}/gym-buddy/chat`, {
        message: userMsg,
        user_name: "Janvi"
      });
      setHistory(h => [...h,
        { role: "buddy", text: res.data.buddy_response, sentiment: res.data.sentiment.label }
      ]);
    } catch {}
    setLoading(false);
  };

  const sentimentColor = (s: string) =>
    s === "positive" ? "text-green-400" : s === "negative" ? "text-red-400" : "text-yellow-400";

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">💬 Virtual Gym Buddy</h2>
        <Badge label="Module 5" color="yellow" />
      </div>
      <div className="bg-[#111] rounded-xl p-3 h-52 overflow-y-auto mb-3 flex flex-col gap-2">
        {history.length === 0 && (
          <p className="text-gray-500 text-xs text-center mt-16">
            Say something to your gym buddy!
          </p>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-[#2a2a2a] text-gray-200"
            }`}>
              {m.text}
              {m.sentiment && (
                <div className={`text-xs mt-1 ${sentimentColor(m.sentiment)}`}>
                  {m.sentiment}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-gray-400">
              Typing...
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="How are you feeling today?"
          className="flex-1 bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-500"
        />
        <button onClick={send} disabled={loading}
          className="px-4 py-2 rounded-xl text-sm bg-yellow-600 hover:bg-yellow-700 text-white transition disabled:opacity-50">
          Send
        </button>
      </div>
    </Card>
  );
}

function HabitPredictor() {
  const [form, setForm] = useState({
    day_of_week: 1, days_since_last: 1,
    current_streak: 3, energy_level: 7
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/habits/predict`, {
        ...form, user_name: "Janvi"
      });
      setResult(res.data);
    } catch {}
    setLoading(false);
  };

  const riskColor = (r: string) =>
    r === "low" ? "text-green-400" : r === "medium" ? "text-yellow-400" : "text-red-400";

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🧠 Habit Predictor</h2>
        <Badge label="Module 4" color="orange" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Day</label>
          <select value={form.day_of_week}
            onChange={e => setForm(f => ({...f, day_of_week: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none">
            {days.map((d,i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Energy (1-10)</label>
          <input type="number" min={1} max={10}
            value={form.energy_level}
            onChange={e => setForm(f => ({...f, energy_level: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Days since last workout</label>
          <input type="number" min={0}
            value={form.days_since_last}
            onChange={e => setForm(f => ({...f, days_since_last: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Current streak</label>
          <input type="number" min={0}
            value={form.current_streak}
            onChange={e => setForm(f => ({...f, current_streak: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none"
          />
        </div>
      </div>
      <button onClick={predict} disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-50 mb-3">
        {loading ? "Predicting..." : "Predict My Habit"}
      </button>
      {result && (
        <div className="bg-[#111] rounded-xl p-3 text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Skip risk:</span>
            <span className={`font-bold ${riskColor(result.prediction.risk_level)}`}>
              {result.prediction.risk_level.toUpperCase()} ({Math.round(result.prediction.skip_probability * 100)}%)
            </span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">{result.motivational_nudge}</p>
        </div>
      )}
    </Card>
  );
}

function IoTSync() {
  const [readings, setReadings] = useState<any>(null);
  const [zone, setZone]         = useState<any>(null);
  const [active, setActive]     = useState(false);
  const [summary, setSummary]   = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = async () => {
    await axios.post(`${API}/iot/session/start`);
    setActive(true);
    setSummary(null);
    pollRef.current = setInterval(async () => {
      const [r, z] = await Promise.all([
        axios.get(`${API}/iot/readings`),
        axios.get(`${API}/iot/heart-rate-zone`)
      ]);
      setReadings(r.data.readings);
      setZone(z.data);
    }, 2000);
  };

  const stopSession = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    const res = await axios.post(`${API}/iot/session/stop`);
    setSummary(res.data.summary);
    setActive(false);
    setReadings(null);
  };

  const zoneColor = (c: string) => ({
    blue: "text-blue-400", green: "text-green-400",
    yellow: "text-yellow-400", orange: "text-orange-400", red: "text-red-400"
  }[c] ?? "text-gray-400");

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">📡 IoT Gym Sync</h2>
        <Badge label="Module 3" color={active ? "green" : "gray"} />
      </div>
      {readings && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "❤️ HR", value: `${readings.heart_rate} bpm` },
            { label: "👟 Steps", value: readings.steps },
            { label: "🔥 Cals", value: `${readings.calories_burned} kcal` },
            { label: "⚡ Resistance", value: `Level ${readings.resistance_level}` },
            { label: "🏃 Speed", value: `${readings.speed_kmh} km/h` },
            { label: "⏱ Duration", value: `${readings.workout_duration}s` },
          ].map((item, i) => (
            <div key={i} className="bg-[#111] rounded-xl p-2 text-center">
              <div className="text-xs text-gray-400">{item.label}</div>
              <div className="text-sm font-bold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      )}
      {zone && readings && (
        <div className="bg-[#111] rounded-xl px-3 py-2 mb-4 text-sm">
          <span className="text-gray-400">Zone: </span>
          <span className={`font-bold capitalize ${zoneColor(zone.color)}`}>
            {zone.zone} — {zone.description}
          </span>
        </div>
      )}
      {summary && (
        <div className="bg-[#111] rounded-xl p-3 mb-4 text-sm">
          <p className="text-gray-400 text-xs mb-2 font-medium">Session Summary</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-gray-400">Avg HR:</span>
            <span className="text-white">{summary.avg_heart_rate} bpm</span>
            <span className="text-gray-400">Peak HR:</span>
            <span className="text-white">{summary.peak_heart_rate} bpm</span>
            <span className="text-gray-400">Total Steps:</span>
            <span className="text-white">{summary.total_steps}</span>
            <span className="text-gray-400">Calories:</span>
            <span className="text-white">{Math.round(summary.total_calories)} kcal</span>
          </div>
        </div>
      )}
      {!readings && !summary && (
        <div className="text-center text-gray-500 text-sm py-8">
          Start a session to see live sensor data
        </div>
      )}
      <button onClick={active ? stopSession : startSession}
        className={`w-full py-2 rounded-xl text-sm font-medium transition text-white ${
          active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }`}>
        {active ? "Stop Session" : "Start Gym Session"}
      </button>
    </Card>
  );
}

function PerformanceScorer() {
  const [form, setForm] = useState({
    exercise: "squat", reps_completed: 15,
    target_reps: 12, avg_angle_accuracy: 80
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const score = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/performance/score`, {
        ...form, user_name: "Janvi", save_score: true
      });
      setResult(res.data.score);
    } catch {}
    setLoading(false);
  };

  const gradeColor = (g: string) => ({
    A: "text-green-400", B: "text-blue-400",
    C: "text-yellow-400", D: "text-orange-400", F: "text-red-400"
  }[g] ?? "text-gray-400");

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">📊 Performance Scorer</h2>
        <Badge label="Module 6" color="blue" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Exercise</label>
          <select value={form.exercise}
            onChange={e => setForm(f => ({...f, exercise: e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none">
            {["squat","curl","pushup"].map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Reps done</label>
          <input type="number" value={form.reps_completed}
            onChange={e => setForm(f => ({...f, reps_completed: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Target reps</label>
          <input type="number" value={form.target_reps}
            onChange={e => setForm(f => ({...f, target_reps: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Form accuracy %</label>
          <input type="number" min={0} max={100} value={form.avg_angle_accuracy}
            onChange={e => setForm(f => ({...f, avg_angle_accuracy: +e.target.value}))}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm text-gray-200 focus:outline-none"
          />
        </div>
      </div>
      <button onClick={score} disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 mb-3">
        {loading ? "Scoring..." : "Score My Workout"}
      </button>
      {result && (
        <div className="bg-[#111] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-white">{result.total_score}</span>
            <span className={`text-4xl font-bold ${gradeColor(result.grade)}`}>{result.grade}</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{result.feedback}</p>
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <div className="bg-[#1a1a1a] rounded p-1">
              <div className="text-gray-400">Reps</div>
              <div className="text-white font-bold">{result.breakdown.rep_score}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded p-1">
              <div className="text-gray-400">Form</div>
              <div className="text-white font-bold">{result.breakdown.form_score}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded p-1">
              <div className="text-gray-400">Bonus</div>
              <div className="text-white font-bold">{result.breakdown.consistency_bonus}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function GymRecommender() {
  const [form, setForm] = useState({
    goal: "lose weight and build muscle",
    fitness_level: "beginner",
    available_days: 4
  });
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const recommend = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/recommender/recommend`, {
        ...form, include_videos: true
      });
      setResult(res.data);
    } catch {}
    setLoading(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🗺️ Gym Recommender</h2>
        <Badge label="Module 7" color="green" />
      </div>
      <div className="flex flex-col gap-3 mb-4">
        <input value={form.goal}
          onChange={e => setForm(f => ({...f, goal: e.target.value}))}
          placeholder="Your fitness goal..."
          className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
        />
        <div className="flex gap-2">
          <select value={form.fitness_level}
            onChange={e => setForm(f => ({...f, fitness_level: e.target.value}))}
            className="flex-1 bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none">
            {["beginner","intermediate","advanced"].map(l =>
              <option key={l}>{l}</option>
            )}
          </select>
          <select value={form.available_days}
            onChange={e => setForm(f => ({...f, available_days: +e.target.value}))}
            className="flex-1 bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none">
            {[2,3,4,5,6].map(d => <option key={d} value={d}>{d} days/week</option>)}
          </select>
        </div>
      </div>
      <button onClick={recommend} disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 mb-3">
        {loading ? "Finding recommendations..." : "Get Recommendations"}
      </button>
      {result && (
        <div className="space-y-3">
          <div className="bg-[#111] rounded-xl p-3 text-sm text-gray-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
            {result.recommendation}
          </div>
          {result.video_recommendations?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">📹 Recommended Videos</p>
              {result.video_recommendations.map((v: any, i: number) => (
                <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#111] hover:bg-[#1f1f1f] rounded-xl p-2 mb-1 transition">
                  <span className="text-red-400 text-lg">▶</span>
                  <div>
                    <p className="text-xs text-white font-medium line-clamp-1">{v.title}</p>
                    <p className="text-xs text-gray-500">{v.channel}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);

  const modules = [
    { label: "🏋️ Trainer",    component: <GymTrainer /> },
    { label: "🥗 Dietician",  component: <Dietician /> },
    { label: "💬 Buddy",      component: <GymBuddy /> },
    { label: "🧠 Habits",     component: <HabitPredictor /> },
    { label: "📡 IoT",        component: <IoTSync /> },
    { label: "📊 Scorer",     component: <PerformanceScorer /> },
    { label: "🗺️ Recommend",  component: <GymRecommender /> },
  ];

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">AI Gym & Fitness Assistant</h1>
            <p className="text-xs text-gray-400 mt-0.5">7 AI modules · Powered by Groq + MediaPipe</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">All systems online</span>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-[#151515] border-b border-[#2a2a2a] px-6">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto py-2">
          {modules.map((m, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                activeTab === i
                  ? "bg-[#2a2a2a] text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-[#1f1f1f]"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active module */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="max-w-xl mx-auto">
          {modules[activeTab].component}
        </div>
      </div>
    </main>
  );
}