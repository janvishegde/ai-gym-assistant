"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000";

// ── Design tokens ─────────────────────────────────────────
const MODULES = [
  { id: 0, icon: "🏋️", label: "Trainer",    color: "#f97316", glow: "rgba(249,115,22,0.4)"  },
  { id: 1, icon: "🥗", label: "Dietician",  color: "#22c55e", glow: "rgba(34,197,94,0.4)"   },
  { id: 2, icon: "💬", label: "Buddy",      color: "#a78bfa", glow: "rgba(167,139,250,0.4)" },
  { id: 3, icon: "🧠", label: "Habits",     color: "#f59e0b", glow: "rgba(245,158,11,0.4)"  },
  { id: 4, icon: "📡", label: "IoT",        color: "#06b6d4", glow: "rgba(6,182,212,0.4)"   },
  { id: 5, icon: "📊", label: "Scorer",     color: "#3b82f6", glow: "rgba(59,130,246,0.4)"  },
  { id: 6, icon: "🗺️", label: "Recommend", color: "#ec4899", glow: "rgba(236,72,153,0.4)"  },
];

// ── Helpers ───────────────────────────────────────────────
function GlowCard({ children, color, glow, className = "" }: {
  children: React.ReactNode; color: string; glow: string; className?: string;
}) {
  return (
    <div className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
        border: `1px solid ${color}33`,
        boxShadow: `0 0 40px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        backdropFilter: "blur(20px)"
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}15 0%, transparent 60%)`
        }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl px-4 py-3"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <span className="text-xs font-medium mb-1" style={{ color: `${color}99` }}>{label}</span>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function GlowButton({ onClick, disabled, color, glow, children, className = "" }: {
  onClick: () => void; disabled?: boolean; color: string;
  glow: string; children: React.ReactNode; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`relative rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        boxShadow: disabled ? "none" : `0 0 20px ${glow}, 0 4px 15px rgba(0,0,0,0.3)`,
        transform: disabled ? "none" : undefined
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, multiline = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition-all duration-200";
  const style = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={2} className={`${cls} resize-none`} style={style} />
  );
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className={cls} style={style} />
  );
}

// ── Module 1: Gym Trainer ─────────────────────────────────
function GymTrainer() {
  const mod = MODULES[0];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps]       = useState(0);
  const [feedback, setFeedback] = useState("Start camera to begin tracking");
  const [exercise, setExercise] = useState("squat");
  const [running, setRunning]   = useState(false);
  const [angle, setAngle]       = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) { videoRef.current.srcObject = stream; setRunning(true); }
  };

  const stopCamera = () => {
    (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); setFeedback("Camera stopped");
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(async () => {
      const canvas = canvasRef.current, video = videoRef.current;
      if (!canvas || !video) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const b64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      try {
        const res = await axios.post(`${API}/gym-trainer/analyze-pose`, { image_base64: b64, exercise });
        setReps(res.data.reps); setFeedback(res.data.feedback);
        setAngle(res.data.angle);
      } catch {}
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, exercise]);

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">AI Gym Trainer</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>Computer Vision · Real-time Rep Count</p>
        </div>
        <span className="text-3xl">{mod.icon}</span>
      </div>

      {/* Exercise selector */}
      <div className="flex gap-2 mb-5">
        {["squat","curl","pushup"].map(ex => (
          <button key={ex} onClick={() => { setExercise(ex); setReps(0); }}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold capitalize transition-all duration-200"
            style={{
              background: exercise === ex ? mod.color : "rgba(255,255,255,0.05)",
              color: exercise === ex ? "white" : "rgba(255,255,255,0.5)",
              boxShadow: exercise === ex ? `0 0 15px ${mod.glow}` : "none",
              border: `1px solid ${exercise === ex ? mod.color : "rgba(255,255,255,0.1)"}`
            }}>
            {ex}
          </button>
        ))}
      </div>

      {/* Camera feed */}
      <div className="relative rounded-2xl overflow-hidden mb-5"
        style={{ height: 220, background: "rgba(0,0,0,0.5)", border: `1px solid ${mod.color}33` }}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-4xl">📸</div>
            <p className="text-white/40 text-sm">Camera off</p>
          </div>
        )}
        {/* Rep counter overlay */}
        <div className="absolute top-3 left-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(0,0,0,0.8)", border: `1px solid ${mod.color}66` }}>
          <div className="text-xs font-bold uppercase mb-0.5" style={{ color: mod.color }}>{exercise}</div>
          <div className="text-5xl font-black text-white leading-none">{reps}</div>
          <div className="text-xs text-white/40 mt-0.5">reps</div>
        </div>
        {angle !== null && running && (
          <div className="absolute top-3 right-3 rounded-xl px-3 py-2"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-xs text-white/50">angle</div>
            <div className="text-lg font-bold text-white">{angle}°</div>
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="rounded-2xl px-4 py-3 mb-5 text-sm font-medium"
        style={{ background: `${mod.color}15`, border: `1px solid ${mod.color}30`, color: mod.color }}>
        💡 {feedback}
      </div>

      <div className="flex gap-3">
        <GlowButton onClick={running ? stopCamera : startCamera}
          color={running ? "#ef4444" : mod.color}
          glow={running ? "rgba(239,68,68,0.4)" : mod.glow}
          className="flex-1">
          {running ? "⏹ Stop Camera" : "▶ Start Camera"}
        </GlowButton>
        <button onClick={async () => { await axios.post(`${API}/gym-trainer/reset?exercise=${exercise}`); setReps(0); }}
          className="px-4 py-3 rounded-2xl text-sm font-bold text-white/60 hover:text-white transition"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Reset
        </button>
      </div>
    </GlowCard>
  );
}

// ── Module 2: Dietician ───────────────────────────────────
function Dietician() {
  const mod = MODULES[1];
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState("");
  const [sources, setSources]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<"ask"|"meal"|"grocery">("ask");

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const ep = mode === "ask" ? "/dietician/ask" : mode === "meal" ? "/dietician/meal-plan" : "/dietician/grocery-list";
      const res = await axios.post(`${API}${ep}`, { question, user_profile: { goal: "fitness" } });
      setAnswer(res.data.answer ?? res.data.meal_plan ?? res.data.grocery_list);
      setSources(res.data.sources ?? []);
    } catch (e: any) { setAnswer("Error: " + (e.response?.data?.detail ?? e.message)); }
    setLoading(false);
  };

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">AI Dietician</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>RAG · Nutrition PDFs · Groq LLM</p>
        </div>
        <span className="text-3xl">{mod.icon}</span>
      </div>

      <div className="flex gap-2 mb-4">
        {(["ask","meal","grocery"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all"
            style={{
              background: mode === m ? mod.color : "rgba(255,255,255,0.05)",
              color: mode === m ? "white" : "rgba(255,255,255,0.5)",
              border: `1px solid ${mode === m ? mod.color : "rgba(255,255,255,0.1)"}`,
              boxShadow: mode === m ? `0 0 15px ${mod.glow}` : "none"
            }}>
            {m === "ask" ? "Ask" : m === "meal" ? "Meal Plan" : "Grocery"}
          </button>
        ))}
      </div>

      <Input value={question} onChange={setQuestion} multiline
        placeholder={
          mode === "ask" ? "What should I eat before a workout?" :
          mode === "meal" ? "1800 calorie high protein plan..." :
          "Weekly groceries for muscle gain..."
        }
      />

      <GlowButton onClick={ask} disabled={loading} color={mod.color} glow={mod.glow} className="w-full mt-3 mb-4">
        {loading ? "⏳ Thinking..." : "✨ Ask Dietician"}
      </GlowButton>

      {answer && (
        <div className="rounded-2xl p-4 text-sm text-white/80 max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {answer}
        </div>
      )}
      {sources.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold mb-2" style={{ color: mod.color }}>📚 Sources</p>
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/50"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              📄 <span>{s.document}</span><span className="ml-auto">p.{s.page}</span>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
}

// ── Module 5: Gym Buddy ───────────────────────────────────
function GymBuddy() {
  const mod = MODULES[2];
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!message.trim()) return;
    const msg = message; setMessage(""); setLoading(true);
    setHistory(h => [...h, { role: "user", text: msg }]);
    try {
      const res = await axios.post(`${API}/gym-buddy/chat`, { message: msg, user_name: "Janvi" });
      setHistory(h => [...h, { role: "buddy", text: res.data.buddy_response, sentiment: res.data.sentiment.label }]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const sentimentEmoji = (s: string) => s === "positive" ? "😊" : s === "negative" ? "😔" : "😐";
  const sentimentColor = (s: string) => s === "positive" ? "#22c55e" : s === "negative" ? "#ef4444" : "#f59e0b";

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">Virtual Gym Buddy</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>Sentiment AI · Emotional Support</p>
        </div>
        <span className="text-3xl">{mod.icon}</span>
      </div>

      <div className="rounded-2xl p-4 mb-4 flex flex-col gap-3 overflow-y-auto"
        style={{ height: 240, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {history.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-sm gap-2">
            <span className="text-4xl">💬</span>
            Talk to your AI gym buddy!
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm"
              style={{
                background: m.role === "user" ? mod.color : "rgba(255,255,255,0.07)",
                color: "white",
                border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)"
              }}>
              {m.text}
              {m.sentiment && (
                <div className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: sentimentColor(m.sentiment) }}>
                  {sentimentEmoji(m.sentiment)} {m.sentiment}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 text-sm text-white/40"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              ✦ typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <Input value={message} onChange={setMessage} placeholder="How are you feeling today?" />
        <GlowButton onClick={send} disabled={loading || !message.trim()} color={mod.color} glow={mod.glow}>
          Send
        </GlowButton>
      </div>
    </GlowCard>
  );
}

// ── Module 4: Habit Predictor ─────────────────────────────
function HabitPredictor() {
  const mod = MODULES[3];
  const [form, setForm] = useState({ day_of_week: 1, days_since_last: 1, current_streak: 3, energy_level: 7 });
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/habits/predict`, { ...form, user_name: "Janvi" });
      setResult(res.data);
    } catch {} setLoading(false);
  };

  const riskColor = (r: string) => r === "low" ? "#22c55e" : r === "medium" ? "#f59e0b" : "#ef4444";
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">Habit Predictor</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>ML Model · Skip Prediction · Nudges</p>
        </div>
        <span className="text-3xl">{mod.icon}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "Day of Week", key: "day_of_week", type: "select" },
          { label: "Energy Level (1-10)", key: "energy_level", type: "number", min: 1, max: 10 },
          { label: "Days Since Last Workout", key: "days_since_last", type: "number", min: 0 },
          { label: "Current Streak", key: "current_streak", type: "number", min: 0 },
        ].map(({ label, key, type, min, max }: any) => (
          <div key={key}>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: `${mod.color}99` }}>{label}</label>
            {type === "select" ? (
              <select value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            ) : (
              <input type="number" min={min} max={max} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            )}
          </div>
        ))}
      </div>

      <GlowButton onClick={predict} disabled={loading} color={mod.color} glow={mod.glow} className="w-full mb-4">
        {loading ? "⏳ Analysing..." : "🔮 Predict My Habit"}
      </GlowButton>

      {result && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${mod.color}22` }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Skip Risk</span>
            <span className="text-lg font-black" style={{ color: riskColor(result.prediction.risk_level) }}>
              {result.prediction.risk_level.toUpperCase()} · {Math.round(result.prediction.skip_probability * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${result.prediction.skip_probability * 100}%`,
                background: riskColor(result.prediction.risk_level)
              }} />
          </div>
          <p className="text-xs text-white/70 leading-relaxed italic">
            "{result.motivational_nudge}"
          </p>
        </div>
      )}
    </GlowCard>
  );
}

// ── Module 3: IoT Sync ────────────────────────────────────
function IoTSync() {
  const mod = MODULES[4];
  const [readings, setReadings] = useState<any>(null);
  const [zone, setZone]         = useState<any>(null);
  const [active, setActive]     = useState(false);
  const [summary, setSummary]   = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = async () => {
    await axios.post(`${API}/iot/session/start`);
    setActive(true); setSummary(null);
    pollRef.current = setInterval(async () => {
      const [r, z] = await Promise.all([
        axios.get(`${API}/iot/readings`),
        axios.get(`${API}/iot/heart-rate-zone`)
      ]);
      setReadings(r.data.readings); setZone(z.data);
    }, 2000);
  };

  const stopSession = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    const res = await axios.post(`${API}/iot/session/stop`);
    setSummary(res.data.summary); setActive(false); setReadings(null);
  };

  const zoneColors: Record<string, string> = {
    blue: "#3b82f6", green: "#22c55e", yellow: "#f59e0b", orange: "#f97316", red: "#ef4444"
  };

  const metrics = readings ? [
    { icon: "❤️", label: "Heart Rate", value: `${readings.heart_rate}`, unit: "bpm" },
    { icon: "👟", label: "Steps",      value: readings.steps,           unit: "steps" },
    { icon: "🔥", label: "Calories",   value: readings.calories_burned, unit: "kcal" },
    { icon: "⚡", label: "Resistance", value: `L${readings.resistance_level}`, unit: "" },
    { icon: "🏃", label: "Speed",      value: readings.speed_kmh,       unit: "km/h" },
    { icon: "⏱",  label: "Duration",  value: `${readings.workout_duration}`, unit: "s" },
  ] : [];

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">IoT Gym Sync</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>Smart Sensor Simulation · Live Data</p>
        </div>
        <div className="flex items-center gap-2">
          {active && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: mod.color }} />}
          <span className="text-3xl">{mod.icon}</span>
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-lg mb-0.5">{m.icon}</div>
              <div className="text-base font-black text-white">{m.value}</div>
              <div className="text-xs text-white/40">{m.unit || m.label}</div>
            </div>
          ))}
        </div>
      )}

      {zone && readings && (
        <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between text-sm"
          style={{ background: `${zoneColors[zone.color]}15`, border: `1px solid ${zoneColors[zone.color]}30` }}>
          <span className="text-white/60">Training Zone</span>
          <span className="font-black capitalize" style={{ color: zoneColors[zone.color] }}>
            {zone.zone} — {zone.description}
          </span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Avg HR",    value: `${summary.avg_heart_rate} bpm`  },
            { label: "Peak HR",   value: `${summary.peak_heart_rate} bpm` },
            { label: "Steps",     value: summary.total_steps               },
            { label: "Calories",  value: `${Math.round(summary.total_calories)} kcal` },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 flex items-center justify-between"
              style={{ background: `${mod.color}10`, border: `1px solid ${mod.color}20` }}>
              <span className="text-xs text-white/50">{s.label}</span>
              <span className="text-sm font-bold" style={{ color: mod.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {!readings && !summary && (
        <div className="flex flex-col items-center justify-center py-10 text-white/20 gap-2 text-sm">
          <span className="text-4xl">📡</span> Start session to see live data
        </div>
      )}

      <GlowButton onClick={active ? stopSession : startSession}
        color={active ? "#ef4444" : mod.color}
        glow={active ? "rgba(239,68,68,0.4)" : mod.glow}
        className="w-full">
        {active ? "⏹ Stop Session" : "▶ Start Gym Session"}
      </GlowButton>
    </GlowCard>
  );
}

// ── Module 6: Performance Scorer ─────────────────────────
function PerformanceScorer() {
  const mod = MODULES[5];
  const [form, setForm] = useState({ exercise: "squat", reps_completed: 15, target_reps: 12, avg_angle_accuracy: 80 });
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const score = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/performance/score`, { ...form, user_name: "Janvi", save_score: true });
      setResult(res.data.score);
    } catch {} setLoading(false);
  };

  const gradeColor = (g: string) => ({ A:"#22c55e",B:"#3b82f6",C:"#f59e0b",D:"#f97316",F:"#ef4444" }[g] ?? "#999");

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">Performance Scorer</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>Scoring Engine · Grade · History</p>
        </div>
        <span className="text-3xl">{mod.icon}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "Exercise", key: "exercise", type: "select", opts: ["squat","curl","pushup"] },
          { label: "Reps Done", key: "reps_completed", type: "number" },
          { label: "Target Reps", key: "target_reps", type: "number" },
          { label: "Form Accuracy %", key: "avg_angle_accuracy", type: "number", min: 0, max: 100 },
        ].map(({ label, key, type, opts, min, max }: any) => (
          <div key={key}>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: `${mod.color}99` }}>{label}</label>
            {type === "select" ? (
              <select value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none capitalize"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {opts.map((o: string) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type="number" min={min} max={max} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            )}
          </div>
        ))}
      </div>

      <GlowButton onClick={score} disabled={loading} color={mod.color} glow={mod.glow} className="w-full mb-4">
        {loading ? "⏳ Scoring..." : "⚡ Score My Workout"}
      </GlowButton>

      {result && (
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${mod.color}22` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-white/50 mb-0.5">Performance Score</div>
              <div className="text-4xl font-black text-white">{result.total_score}<span className="text-lg text-white/40">/100</span></div>
            </div>
            <div className="text-6xl font-black" style={{ color: gradeColor(result.grade) }}>
              {result.grade}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${result.total_score}%`, background: gradeColor(result.grade) }} />
          </div>
          <p className="text-sm text-white/70 mb-3">{result.feedback}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Reps", value: result.breakdown.rep_score },
              { label: "Form", value: result.breakdown.form_score },
              { label: "Bonus", value: result.breakdown.consistency_bonus },
            ].map((b, i) => (
              <div key={i} className="rounded-xl p-2 text-center"
                style={{ background: `${mod.color}10`, border: `1px solid ${mod.color}20` }}>
                <div className="text-xs text-white/50 mb-0.5">{b.label}</div>
                <div className="text-base font-black" style={{ color: mod.color }}>{b.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlowCard>
  );
}

// ── Module 7: Gym Recommender ─────────────────────────────
function GymRecommender() {
  const mod = MODULES[6];
  const [form, setForm] = useState({ goal: "lose weight and build muscle", fitness_level: "beginner", available_days: 4 });
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const recommend = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/recommender/recommend`, { ...form, include_videos: true });
      setResult(res.data);
    } catch {} setLoading(false);
  };

  return (
    <GlowCard color={mod.color} glow={mod.glow} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">Gym Recommender</h2>
          <p className="text-xs mt-0.5" style={{ color: mod.color }}>RAG · PDF Knowledge · YouTube Videos</p>
        </div>
        <span className="text-3xl">{mod.icon}</span>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <Input value={form.goal} onChange={v => setForm(f => ({ ...f, goal: v }))}
          placeholder="Your fitness goal..." />
        <div className="flex gap-2">
          {(["beginner","intermediate","advanced"] as const).map(l => (
            <button key={l} onClick={() => setForm(f => ({ ...f, fitness_level: l }))}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
              style={{
                background: form.fitness_level === l ? mod.color : "rgba(255,255,255,0.05)",
                color: form.fitness_level === l ? "white" : "rgba(255,255,255,0.5)",
                border: `1px solid ${form.fitness_level === l ? mod.color : "rgba(255,255,255,0.1)"}`,
              }}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[2,3,4,5,6].map(d => (
            <button key={d} onClick={() => setForm(f => ({ ...f, available_days: d }))}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: form.available_days === d ? mod.color : "rgba(255,255,255,0.05)",
                color: form.available_days === d ? "white" : "rgba(255,255,255,0.5)",
                border: `1px solid ${form.available_days === d ? mod.color : "rgba(255,255,255,0.1)"}`,
              }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <GlowButton onClick={recommend} disabled={loading} color={mod.color} glow={mod.glow} className="w-full mb-4">
        {loading ? "⏳ Finding recommendations..." : "🔍 Get Recommendations"}
      </GlowButton>

      {result && (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 text-sm text-white/80 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {result.recommendation}
          </div>
          {result.video_recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: mod.color }}>📹 Video Recommendations</p>
              {result.video_recommendations.map((v: any, i: number) => (
                <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-3 mb-2 transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${mod.color}20` }}>
                    <span className="text-red-400">▶</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-white font-semibold truncate">{v.title}</p>
                    <p className="text-xs text-white/40">{v.channel}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </GlowCard>
  );
}

function ClientTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);
  return <>{time} · 7 modules active</>;
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);

  const components = [
    <GymTrainer />, <Dietician />, <GymBuddy />,
    <HabitPredictor />, <IoTSync />, <PerformanceScorer />, <GymRecommender />
  ];

  const activeModule = MODULES[activeTab];

  return (
    <main className="min-h-screen text-white" style={{
      background: "radial-gradient(ellipse at 20% 20%, #0d1117 0%, #050508 60%, #0a0a0f 100%)"
    }}>
      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-1000"
          style={{ background: activeModule.color }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10 transition-all duration-1000"
          style={{ background: activeModule.color }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">All Systems Online</span>
              </div>
              <h1 className="text-2xl font-black text-white">AI Gym Assistant</h1>
              <p className="text-xs text-white/30 mt-0.5">
                <ClientTime />
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30 mb-0.5">Welcome back</div>
              <div className="text-lg font-black" style={{ color: activeModule.color }}>Janvi 💪</div>
            </div>
          </div>

          {/* Module tab strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {MODULES.map((m, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-200"
                style={{
                  background: activeTab === i ? `${m.color}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${activeTab === i ? m.color : "rgba(255,255,255,0.08)"}`,
                  boxShadow: activeTab === i ? `0 0 20px ${m.glow}` : "none",
                  transform: activeTab === i ? "translateY(-1px)" : "none"
                }}>
                <span className="text-lg leading-none">{m.icon}</span>
                <span className="text-xs font-bold whitespace-nowrap"
                  style={{ color: activeTab === i ? m.color : "rgba(255,255,255,0.4)" }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pb-10">
        {components[activeTab]}
      </div>
    </main>
  );
}