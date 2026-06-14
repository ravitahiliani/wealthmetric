Here is the complete, integrated code. You can copy and paste this directly into your `src/App.jsx` file. It includes the new homepage design as the default view, along with all the calculators and styling.

```jsx
import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell, AreaChart, Area
} from "recharts";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f6f8fa;font-family:'Inter',sans-serif;color:#1f2328}
  input[type=range]{-webkit-appearance:none;width:100%;height:4px;background:#d0d7de;border-radius:2px;outline:none}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#0d9373;cursor:pointer;border:2px solid #ffffff;box-shadow:0 1px 6px rgba(13,147,115,0.4)}
  input[type=number],input[type=month],input[type=text]{background:#ffffff;border:1px solid #d0d7de;border-radius:8px;color:#1f2328;padding:9px 13px;font-size:14px;width:100%;outline:none;font-family:'Inter',sans-serif;transition:border-color 0.15s,box-shadow 0.15s}
  input[type=number]:focus,input[type=month]:focus,input[type=text]:focus{border-color:#0d9373;box-shadow:0 0 0 3px rgba(13,147,115,0.12)}
  select{background:#ffffff;border:1px solid #d0d7de;border-radius:8px;color:#1f2328;padding:9px 13px;font-size:14px;outline:none;font-family:'Inter',sans-serif;transition:border-color 0.15s}
  select:focus{border-color:#0d9373;box-shadow:0 0 0 3px rgba(13,147,115,0.12)}
  .card{background:#ffffff;border:1px solid #d0d7de;border-radius:14px;padding:20px 22px;box-shadow:0 1px 4px rgba(31,35,40,0.1),0 0 0 1px rgba(31,35,40,0.04);transition:box-shadow 0.2s}
  .pill{cursor:pointer;padding:6px 13px;border-radius:7px;font-size:12px;font-weight:600;transition:all 0.15s;border:1px solid #d0d7de;white-space:nowrap;user-select:none;background:#ffffff;color:#444c56}
  .pill.on{background:#0d9373;color:#ffffff;border-color:#0d9373;box-shadow:0 2px 6px rgba(13,147,115,0.25)}
  .pill.off:hover{color:#1f2328;border-color:#0d9373;background:#f0fdf9}
  .asset-pill{cursor:pointer;padding:5px 11px;border-radius:20px;font-size:12px;font-weight:600;transition:all 0.15s;border:1.5px solid transparent;white-space:nowrap;user-select:none}
  .lbl{font-size:11px;color:#444c56;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;margin-bottom:8px}
  .toggle-sw{width:40px;height:22px;border-radius:11px;transition:background 0.2s;display:flex;align-items:center;padding:3px;cursor:pointer;flex-shrink:0}
  .toggle-kn{width:16px;height:16px;border-radius:50%;background:white;transition:transform 0.2s;box-shadow:0 1px 3px rgba(31,35,40,0.3)}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#f6f8fa}
  ::-webkit-scrollbar-thumb{background:#d0d7de;border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:#9198a1}
  .nav-tab{cursor:pointer;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:8px;white-space:nowrap;user-select:none; border: none; background: transparent; font-family: 'Inter', sans-serif;}
  .nav-tab.active{background:#0d9373;color:#ffffff;box-shadow:0 2px 8px rgba(13,147,115,0.3)}
  .nav-tab.inactive{color:#444c56;border:1px solid #d0d7de;background:#ffffff}
  .nav-tab.inactive:hover{color:#1f2328;border-color:#0d9373;background:#f0fdf9}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatINR(val) {
  const v = Math.abs(val), s = val < 0 ? "-" : "";
  if (v >= 10000000) return `${s}₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `${s}₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `${s}₹${(v / 1000).toFixed(1)}K`;
  return `${s}₹${Math.round(v).toLocaleString("en-IN")}`;
}
function formatINRFull(val) { return `₹${Math.round(Math.abs(val)).toLocaleString("en-IN")}`; }

function Field({ label, value, onChange, suffix = "", prefix = "", step = 1, min = 0, color = "#0d9373", hint }) {
  const [local, setLocal] = React.useState(String(value ?? ""));
  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!focused.current) setLocal(String(value ?? ""));
  }, [value]);
  const numVal = parseFloat(local);
  const isRupee = prefix === "₹";
  let readable = null;
  if (isRupee && !isNaN(numVal) && numVal >= 1000) {
    if (numVal >= 10000000) readable = `${(numVal / 10000000).toFixed(2)} Crore`;
    else if (numVal >= 100000) readable = `${(numVal / 100000).toFixed(2)} Lakh`;
    else readable = `${(numVal / 1000).toFixed(1)}K`;
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: "#444c56", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
        {readable && <div style={{ fontSize: 11, color: color, fontFamily: "Syne", fontWeight: 700, background: "#ffffff", border: `1px solid ${color}33`, borderRadius: 5, padding: "1px 8px" }}>{readable}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #d0d7de", borderRadius: 8, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(31,35,40,0.04)" }}>
        {prefix && <span style={{ padding: "0 10px", color, fontFamily: "Syne", fontWeight: 700, fontSize: 14, borderRight: "1px solid #d0d7de", display: "flex", alignItems: "center", background: "#f6f8fa", alignSelf: "stretch" }}>{prefix}</span>}
        <input type="number" value={local} step={step} min={min}
          onFocus={() => { focused.current = true; }}
          onChange={e => {
            setLocal(e.target.value);
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          onBlur={e => {
            focused.current = false;
            const n = parseFloat(e.target.value);
            if (isNaN(n) || e.target.value === "") setLocal(String(value ?? ""));
            else { onChange(n); setLocal(String(n)); }
          }}
          style={{ flex: 1, background: "transparent", border: "none", color: "#1f2328", padding: "9px 12px", fontSize: 15, fontFamily: "Syne", fontWeight: 700, outline: "none", width: "100%" }} />
        {suffix && <span style={{ padding: "0 12px", color: "#444c56", fontSize: 12, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: "#444c56", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Toggle({ on, set, color = "#0d9373" }) {
  return (
    <div className="toggle-sw" style={{ background: on ? color : "#d0d7de" }} onClick={() => set(p => !p)}>
      <div className="toggle-kn" style={{ transform: on ? "translateX(17px)" : "translateX(0)" }} />
    </div>
  );
}

function PillRow({ options, value, set, activeColor }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {options.map(([k, label]) => (
        <div key={k} className={`pill ${value === k ? "on" : "off"}`}
          style={value === k && activeColor ? { background: activeColor, borderColor: activeColor, color: "#f6f8fa" } : {}}
          onClick={() => set(k)}>{label}</div>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label, labelPrefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1f2328", border: "1px solid #374151", borderRadius: 9, padding: "11px 15px", minWidth: 190, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000 }}>
      <p style={{ color: "#e5e7eb", fontWeight: 700, marginBottom: 6, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" }}>{labelPrefix}{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, fontSize: 12, margin: "3px 0", display: "flex", justifyContent: "space-between", gap: 16, filter: "brightness(1.2)" }}>
          <span>{p.name}</span><span style={{ fontFamily: "Syne", fontWeight: 700 }}>{typeof p.value === "number" ? formatINR(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── DATA ENGINE MECHANICS ───────────────────────────────────────────────────
const BASE_RETURNS = [
  -0.052, -0.091, -0.082, -0.038, -0.062, 0.041, 0.018, -0.023, -0.071, -0.031, -0.028, -0.019,
  -0.041, -0.031, -0.062, -0.018, 0.028, -0.041, -0.031, -0.072, -0.091, 0.031, 0.062, 0.041,
  0.018, -0.021, 0.031, -0.041, -0.018, 0.051, -0.028, -0.041, -0.051, 0.018, 0.031, 0.041,
  0.041, -0.018, -0.031, 0.062, 0.051, 0.028, 0.041, 0.071, 0.082, 0.091, 0.062, 0.108,
  0.018, 0.051, 0.028, -0.171, 0.041, 0.028, 0.031, 0.018, 0.051, 0.018, 0.082, 0.041,
  0.062, 0.028, 0.071, 0.051, 0.028, 0.082, 0.041, 0.062, 0.091, 0.028, 0.071, 0.082,
  0.121, 0.051, 0.082, 0.041, -0.141, -0.031, 0.028, 0.091, 0.062, 0.041, 0.028, 0.071,
  0.018, -0.028, 0.031, 0.062, 0.051, 0.028, 0.041, 0.031, 0.121, 0.151, -0.051, 0.091,
  -0.121, -0.031, -0.141, 0.091, 0.028, -0.191, 0.041, -0.031, -0.121, -0.241, -0.051, 0.071,
  -0.028, -0.051, -0.031, 0.151, 0.281, 0.021, 0.091, 0.018, 0.062, -0.071, 0.051, 0.031,
  0.062, 0.028, 0.071, 0.051, -0.031, 0.021, 0.018, 0.028, 0.091, 0.051, -0.021, 0.041,
  -0.091, -0.031, 0.021, -0.041, -0.031, -0.021, -0.031, -0.081, -0.031, -0.091, -0.091, -0.021,
  0.121, -0.018, 0.018, 0.041, -0.061, 0.021, 0.051, 0.018, 0.071, 0.041, 0.051, 0.028,
  0.028, -0.051, -0.021, 0.041, -0.031, -0.051, -0.018, -0.041, 0.031, 0.091, 0.028, 0.018,
  0.018, 0.028, 0.051, 0.018, 0.031, 0.041, 0.028, 0.018, -0.028, -0.041, 0.031, -0.018,
  0.062, -0.051, -0.041, 0.031, 0.021, -0.021, 0.018, -0.061, -0.071, -0.031, -0.018, -0.021,
  -0.051, -0.071, 0.101, 0.018, 0.041, 0.021, 0.028, 0.041, -0.021, -0.018, -0.041, 0.031,
  0.041, 0.028, 0.031, 0.018, 0.021, 0.018, 0.051, 0.031, 0.028, 0.062, 0.021, 0.031,
  0.051, -0.031, -0.031, 0.041, 0.021, 0.018, 0.028, 0.031, -0.071, -0.051, 0.051, -0.071,
  0.051, 0.021, 0.081, 0.018, 0.021, 0.018, 0.041, -0.021, 0.041, 0.038, -0.051, 0.071,
  -0.061, -0.061, -0.231, 0.141, 0.051, 0.071, 0.111, 0.028, -0.018, -0.031, 0.111, 0.071,
  -0.021, 0.061, 0.011, 0.031, 0.051, 0.001, -0.001, 0.091, 0.031, 0.001, -0.041, 0.021,
  -0.021, 0.031, 0.041, -0.021, -0.041, -0.048, 0.082, -0.028, 0.038, 0.051, -0.001, -0.038,
  -0.028, -0.018, 0.021, 0.041, 0.028, 0.051, 0.031, -0.021, 0.018, 0.041, 0.051, 0.071,
  -0.001, 0.028, 0.018, 0.041, 0.028, 0.071, 0.041, 0.018, 0.028, -0.061, 0.021, 0.031,
];

const ASSET_PROFILES = {
  nifty50: { label: "Nifty 50", short: "N50", color: "#0d9373", group: "index", startPrice: 1528, mult: 1.00, vol: 0.000, drift: 0.0000 },
  banknifty: { label: "Bank Nifty", short: "BNK", color: "#3b82f6", group: "index", startPrice: 2800, mult: 1.30, vol: 0.008, drift: 0.0005 },
  midcap150: { label: "Midcap 150", short: "MID", color: "#f59e0b", group: "index", startPrice: 2200, mult: 1.20, vol: 0.006, drift: 0.0008 },
  smallcap250: { label: "Smallcap 250", short: "SML", color: "#ec4899", group: "index", startPrice: 1800, mult: 1.35, vol: 0.010, drift: 0.0010 },
  fd: { label: "Fixed Deposit", short: "FD", color: "#64748b", group: "fixed", isFixed: true },
  bond: { label: "Gov Bond", short: "BND", color: "#78716c", group: "fixed", isFixed: true },
};

const SIP_FREQS = {
  daily: { label: "Daily", perMonth: 22 },
  weekly: { label: "Weekly", perMonth: 4.33 },
  monthly: { label: "Monthly", perMonth: 1 },
  quarterly: { label: "Quarterly", perMonth: 1 / 3 },
  annually: { label: "Annually", perMonth: 1 / 12 },
};

const STEPUP_FREQS = {
  none: { label: "None", everyN: 0 },
  monthly: { label: "Monthly", everyN: 1 },
  quarterly: { label: "Quarterly", everyN: 3 },
  annually: { label: "Annually", everyN: 12 },
};

function addMonths(yr, mo, n) {
  const d = new Date(yr, mo - 1 + n, 1);
  return { yr: d.getFullYear(), mo: d.getMonth() + 1 };
}
function monthsBetween(sy, sm, ey, em) { return (ey - sy) * 12 + (em - sm); }

function generateAssetData(key) {
  const p = ASSET_PROFILES[key];
  if (p.isFixed) return null;
  const data = {};
  let price = p.startPrice, idx = 0;
  let seed = key.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let yr = 2000; yr <= 2024; yr++) {
    for (let mo = 1; mo <= 12; mo++) {
      const base = BASE_RETURNS[idx] || 0;
      const noise = (rng() - 0.5) * 2 * p.vol;
      price = Math.max(price * (1 + base * p.mult + noise + p.drift), p.startPrice * 0.05);
      data[`${yr}-${String(mo).padStart(2, "0")}`] = Math.round(price * 100) / 100;
      idx++;
    }
  }
  return data;
}
const ALL_DATA = {};
Object.keys(ASSET_PROFILES).forEach(k => { ALL_DATA[k] = generateAssetData(k); });

// ─── PAGES ───────────────────────────────────────────────────────────────────

export function HomeHero({ setActiveTab }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px",
        background: "radial-gradient(circle at center, rgba(13,147,115,0.08) 0%, transparent 60%)",
        marginTop: "20px",
        borderRadius: "24px"
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#ecfdf5",
          color: "#047857",
          padding: "6px 16px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "28px",
          border: "1px solid #a7f3d0"
        }}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }}></span>
        Free • No Ads • Built for India
      </div>

      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: "clamp(3rem, 6vw, 5rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "24px",
          color: "#1f2328"
        }}
      >
        Your Money,<br />
        <span
          style={{
            background: "linear-gradient(90deg, #0d9373 0%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Clearly.
        </span>
      </h1>

      <p
        style={{
          fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
          color: "#444c56",
          maxWidth: "600px",
          margin: "0 auto 40px",
          lineHeight: 1.6,
          fontWeight: 400
        }}
      >
        Personal finance calculators, market intelligence and India insights — built for real decisions.
      </p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => setActiveTab("calc")}
          style={{
            background: "#0d9373",
            color: "#ffffff",
            border: "none",
            padding: "14px 28px",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(13,147,115,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          Open Calculators
        </button>
        <button
          onClick={() => setActiveTab("market")}
          style={{
            background: "#ffffff",
            color: "#1f2328",
            border: "1px solid #d0d7de",
            padding: "14px 28px",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(31,35,40,0.1)",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#f6f8fa"; e.currentTarget.style.borderColor = "#0d9373"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#d0d7de"; }}
        >
          Market Insights
        </button>
      </div>
    </div>
  );
}

function CalculatorPage() {
  const [mode, setMode] = useState("calculate");
  const [annualRate, setAnnualRate] = useState(12);
  const [years, setYears] = useState(10);
  const [lumpsum, setLumpsum] = useState(100000);
  const [sipOn, setSipOn] = useState(true);
  const [sipAmt, setSipAmt] = useState(10000);
  const [sipFreqKey, setSipFreqKey] = useState("monthly");
  const [stepPct, setStepPct] = useState(0);
  const [stepFreq, setStepFreq] = useState("annually");
  const [targetCorpus, setTargetCorpus] = useState(5000000);
  const [fsLumpsum, setFsLumpsum] = useState(100000);
  const [fsSipFreqKey, setFsSipFreqKey] = useState("monthly");
  const [fsStepPct, setFsStepPct] = useState(0);
  const [fsStepFreq, setFsStepFreq] = useState("annually");

  const rate = Number(annualRate) || 0;
  const totalMonths = Math.round((Number(years) || 0) * 12);
  const mr = Math.pow(1 + rate / 100, 1 / 12) - 1;

  const calcResults = useMemo(() => {
    if (totalMonths < 1) return null;
    let lsCorpus = Number(lumpsum) || 0;
    const sipMonthly = (sipOn && sipAmt > 0) ? (sipAmt * (SIP_FREQS[sipFreqKey]?.perMonth || 1)) : 0;
    const everyN = STEPUP_FREQS[stepFreq]?.everyN || 12;
    let sipCorpus = 0, sipInvested = 0, sipCurrentAmt = sipMonthly, sipMsSU = 0;
    const yearData = [];

    for (let m = 1; m <= totalMonths; m++) {
      lsCorpus = lsCorpus * (1 + mr);
      if (sipMonthly > 0) {
        if (stepPct > 0 && m > 1) {
          sipMsSU++;
          if (sipMsSU >= everyN) { sipMsSU = 0; sipCurrentAmt = sipCurrentAmt * (1 + stepPct / 100); }
        }
        sipCorpus = (sipCorpus + sipCurrentAmt) * (1 + mr);
        sipInvested += sipCurrentAmt;
      }
      if (m % 12 === 0 || m === totalMonths) {
        yearData.push({
          yr: parseFloat((m / 12).toFixed(1)),
          lsCorpus: Math.round(lsCorpus),
          sipCorpus: Math.round(sipCorpus),
          lsInvested: Number(lumpsum) || 0,
          sipInvested: Math.round(sipInvested),
          totalCorpus: Math.round(lsCorpus + (sipOn ? sipCorpus : 0)),
          totalInvested: Math.round((Number(lumpsum) || 0) + (sipOn ? sipInvested : 0))
        });
      }
    }
    return {
      yearData,
      ls: { invested: lumpsum, corpus: Math.round(lsCorpus), gain: Math.round(lsCorpus - lumpsum) },
      sip: { invested: Math.round(sipInvested), corpus: Math.round(sipCorpus), gain: Math.round(sipCorpus - sipInvested) },
      total: { invested: Math.round(lumpsum + (sipOn ? sipInvested : 0)), corpus: Math.round(lsCorpus + (sipOn ? sipCorpus : 0)), gain: Math.round((lsCorpus + (sipOn ? sipCorpus : 0)) - (lumpsum + (sipOn ? sipInvested : 0))) }
    };
  }, [lumpsum, sipOn, sipAmt, sipFreqKey, stepPct, stepFreq, mr, totalMonths]);

  const findSipResults = useMemo(() => {
    if (totalMonths < 1 || targetCorpus <= 0) return null;
    const freqMult = SIP_FREQS[fsSipFreqKey]?.perMonth || 1;
    const lsGrowth = (Number(fsLumpsum) || 0) * Math.pow(1 + rate / 100, Number(years) || 0);
    const sipTarget = Math.max(0, targetCorpus - lsGrowth);
    const everyN = STEPUP_FREQS[fsStepFreq]?.everyN || 12;

    let lo = 0, hi = targetCorpus;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      let c = 0, amt = mid * freqMult, ms = 0;
      for (let m = 1; m <= totalMonths; m++) {
        if (m > 1 && fsStepPct > 0) {
          ms++;
          if (ms >= everyN) { ms = 0; amt = amt * (1 + fsStepPct / 100); }
        }
        c = (c + amt) * (1 + mr);
      }
      if (c < sipTarget) lo = mid; else hi = mid;
    }
    const effectiveSip = (lo + hi) / 2;
    const yearData = [];
    let lsC = Number(fsLumpsum) || 0, sipC = 0, sipInv = 0, runningSip = effectiveSip * freqMult, msSU = 0;

    for (let m = 1; m <= totalMonths; m++) {
      lsC = lsC * (1 + mr);
      if (m > 1 && fsStepPct > 0) {
        msSU++;
        if (msSU >= everyN) { msSU = 0; runningSip = runningSip * (1 + fsStepPct / 100); }
      }
      sipC = (sipC + runningSip) * (1 + mr);
      sipInv += runningSip;
      if (m % 12 === 0 || m === totalMonths) {
        yearData.push({
          yr: parseFloat((m / 12).toFixed(1)),
          lsCorpus: Math.round(lsC),
          sipCorpus: Math.round(sipC),
          totalCorpus: Math.round(lsC + sipC),
          target: targetCorpus
        });
      }
    }
    return { effectiveSip, lsGrowth, sipTarget, yearData };
  }, [targetCorpus, fsLumpsum, fsSipFreqKey, fsStepPct, fsStepFreq, rate, years, mr, totalMonths]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <div className="lbl">Operational Mode</div>
          <PillRow options={[["calculate", "Grow Wealth"], ["findsip", "Target Plan"]]} value={mode} set={setMode} activeColor="#0d9373" />
        </div>
        <div className="card">
          <Field label="Return Rate" value={annualRate} onChange={setAnnualRate} suffix="% p.a." step={0.5} />
          <Field label="Duration Timeline" value={years} onChange={setYears} suffix="Yrs" step={1} />
        </div>
        {mode === "calculate" ? (
          <div className="card">
            <Field label="Initial Lumpsum" value={lumpsum} onChange={setLumpsum} prefix="₹" step={5000} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
              <span className="lbl" style={{ marginBottom: 0 }}>Enable SIP Routine</span>
              <Toggle on={sipOn} set={setSipOn} />
            </div>
            {sipOn && (
              <>
                <Field label="SIP Commitment" value={sipAmt} onChange={setSipAmt} prefix="₹" step={500} />
                <PillRow options={Object.entries(SIP_FREQS).map(([k, v]) => [k, v.label])} value={sipFreqKey} set={setSipFreqKey} activeColor="#0d9373" />
                <div style={{ marginTop: 12 }}>
                  <Field label="Step Up Ratio" value={stepPct} onChange={setStepPct} suffix="%" step={1} />
                  <PillRow options={[["monthly", "Mo"], ["quarterly", "Qt"], ["annually", "Yr"]]} value={stepFreq} set={setStepFreq} activeColor="#0d9373" />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="card">
            <Field label="Target Baseline" value={targetCorpus} onChange={setTargetCorpus} prefix="₹" step={50000} />
            <Field label="Seed Lumpsum" value={fsLumpsum} onChange={setFsLumpsum} prefix="₹" step={5000} />
            <div className="lbl" style={{ marginTop: 10 }}>Frequencies</div>
            <PillRow options={Object.entries(SIP_FREQS).map(([k, v]) => [k, v.label])} value={fsSipFreqKey} set={setFsSipFreqKey} activeColor="#0d9373" />
            <div style={{ marginTop: 12 }}>
              <Field label="Auto Step-Up Factor" value={fsStepPct} onChange={setFsStepPct} suffix="%" step={1} />
              <PillRow options={[["monthly", "Mo"], ["quarterly", "Qt"], ["annually", "Yr"]]} value={fsStepFreq} set={setFsStepFreq} activeColor="#0d9373" />
            </div>
          </div>
        )}
      </div>

      <div>
        {mode === "calculate" && calcResults && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div className="card"><h5>Total Outlay</h5><h3 style={{ marginTop: 4 }}>{formatINR(calcResults.total.invested)}</h3></div>
              <div className="card"><h5>Yield Growth</h5><h3 style={{ marginTop: 4 }}>{formatINR(calcResults.total.gain)}</h3></div>
              <div className="card" style={{ background: "#f0fdf9" }}><h5>Estimated Valuation</h5><h3 style={{ marginTop: 4 }}>{formatINR(calcResults.total.corpus)}</h3></div>
            </div>
            <div className="card">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={calcResults.yearData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis dataKey="yr" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatINR} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="totalInvested" fill="#d0d7de" stroke="#9198a1" name="Invested Capital" />
                  <Area type="monotone" dataKey="totalCorpus" fill="#0d9373" stroke="#0d9373" fillOpacity={0.15} name="Total Portfolio Value" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {mode === "findsip" && findSipResults && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <div className="lbl">Sustained Budget Target Required</div>
              <h2 style={{ marginTop: 4 }}>{formatINRFull(findSipResults.effectiveSip)} <span style={{ fontSize: 14, fontWeight: 400 }}>/{fsSipFreqKey}</span></h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div className="card"><h5>Lumpsum Yield Component</h5><p style={{ marginTop: 4, fontWeight: 'bold' }}>{formatINR(findSipResults.lsGrowth)}</p></div>
              <div className="card"><h5>Deficit Left for SIP</h5><p style={{ marginTop: 4, fontWeight: 'bold' }}>{formatINR(findSipResults.sipTarget)}</p></div>
            </div>
            <div className="card">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={findSipResults.yearData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis dataKey="yr" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatINR} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="totalCorpus" stroke="#0d9373" strokeWidth={3} name="Compounded Journey" dot={false} />
                  <Line type="monotone" dataKey="target" stroke="#ec4899" strokeDasharray="5 5" name="Financial Milestone Target" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketSIPPage() {
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipFreq, setSipFreq] = useState("monthly");
  const [startYr, setStartYr] = useState(2015);
  const [endYr, setEndYr] = useState(2024);
  const [selectedAssets, setSelectedAssets] = useState(["nifty50", "banknifty", "fd"]);
  const [fdRate, setFdRate] = useState(7.0);
  const [bondRate, setBondRate] = useState(7.5);

  const simulationResults = useMemo(() => {
    const out = {};
    const totalMonths = monthsBetween(startYr, 1, endYr, 12) + 1;
    if (totalMonths < 2) return out;

    for (const k of selectedAssets) {
      const p = ASSET_PROFILES[k];
      const fxRate = k === "fd" ? fdRate : bondRate;
      let sipCorpus = 0, sipInvested = 0, units = 0;
      const yearData = [];

      for (let i = 0; i < totalMonths; i++) {
        const { yr, mo } = addMonths(startYr, 1, i);
        const mKey = `${yr}-${String(mo).padStart(2, "0")}`;
        const baseAmt = sipAmount * (SIP_FREQS[sipFreq]?.perMonth || 1);

        if (!p.isFixed) {
          const px = ALL_DATA[k]?.[mKey] || p.startPrice;
          units += baseAmt / px;
          sipInvested += baseAmt;
          sipCorpus = units * px;
        } else {
          const mr = Math.pow(1 + fxRate / 100, 1 / 12) - 1;
          sipInvested += baseAmt;
          sipCorpus = (sipCorpus + baseAmt) * (1 + mr);
        }

        if (mo === 12 || i === totalMonths - 1) {
          yearData.push({ year: yr, corpus: Math.round(sipCorpus), invested: Math.round(sipInvested) });
        }
      }

      const totalGain = sipCorpus - sipInvested;
      out[k] = {
        finalCorpus: Math.round(sipCorpus),
        totalInvested: Math.round(sipInvested),
        absReturn: sipInvested > 0 ? (totalGain / sipInvested) * 100 : 0,
        yearData
      };
    }
    return out;
  }, [selectedAssets, sipAmount, sipFreq, startYr, endYr, fdRate, bondRate]);

  const aggregateChartData = useMemo(() => {
    const yrs = Array.from({ length: endYr - startYr + 1 }, (_, i) => startYr + i);
    return yrs.map(yr => {
      const row = { year: yr };
      selectedAssets.forEach(k => {
        const entry = simulationResults[k]?.yearData?.find(d => d.year === yr);
        if (entry) row[k] = entry.corpus;
      });
      return row;
    });
  }, [simulationResults, selectedAssets, startYr, endYr]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <Field label="Allocated Multiplier Amount" value={sipAmount} onChange={setSipAmount} prefix="₹" step={500} />
          <PillRow options={Object.entries(SIP_FREQS).map(([k, v]) => [k, v.label])} value={sipFreq} set={setSipFreq} activeColor="#0d9373" />
        </div>
        <div className="card">
          <Field label="Epoch Start (Year)" value={startYr} onChange={setStartYr} min={2000} max={2023} />
          <Field label="Epoch End (Year)" value={endYr} onChange={setEndYr} min={2001} max={2024} />
        </div>
        <div className="card">
          <div className="lbl">Asset Framework Basket</div>
          {Object.entries(ASSET_PROFILES).map(([k, v]) => {
            const dynamicActive = selectedAssets.includes(k);
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0", opacity: dynamicActive ? 1 : 0.6 }}>
                <span style={{ color: v.color, fontWeight: 600, fontSize: 13 }}>{v.label}</span>
                <Toggle on={dynamicActive} set={() => setSelectedAssets(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])} color={v.color} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {selectedAssets.map(k => {
            const dataNode = simulationResults[k];
            if (!dataNode) return null;
            return (
              <div className="card" key={k} style={{ borderLeft: `5px solid ${ASSET_PROFILES[k].color}` }}>
                <div className="lbl">{ASSET_PROFILES[k].label}</div>
                <h4 style={{ marginTop: 4 }}>{formatINR(dataNode.finalCorpus)}</h4>
                <span style={{ fontSize: 11, color: "#656d76" }}>Outlay: {formatINR(dataNode.totalInvested)} ({dataNode.absReturn.toFixed(1)}% gain)</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={aggregateChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {selectedAssets.map(k => (
                <Line key={k} type="monotone" dataKey={k} stroke={ASSET_PROFILES[k].color} name={ASSET_PROFILES[k].label} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EMIPage() {
  const [loanType, setLoanType] = useState("home");
  const [principal, setPrincipal] = useState(3000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [prepayOn, setPrepayOn] = useState(false);
  const [prepayAmt, setPrepayAmt] = useState(20000);
  const [prepayFreq, setPrepayFreq] = useState("annually");

  const results = useMemo(() => {
    const monthlyRate = rate / (12 * 100);
    const totalPayments = tenure * 12;
    if (monthlyRate === 0 || totalPayments === 0) return null;

    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const baseSchedule = [];
    let balance = principal, totalInterest = 0;

    for (let m = 1; m <= totalPayments; m++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(emi - interestPayment, balance);
      balance -= principalPayment;
      totalInterest += interestPayment;

      if (m % 12 === 0 || balance <= 0) {
        baseSchedule.push({ year: Math.ceil(m / 12), balance: Math.round(balance) });
      }
      if (balance <= 0) break;
    }

    let pBalance = principal, pTotalInterest = 0, pInvestedPrepay = 0, actualMonths = totalPayments;
    const prepaySchedule = [];

    for (let m = 1; m <= totalPayments; m++) {
      if (pBalance <= 0) { actualMonths = m - 1; break; }
      const interestPayment = pBalance * monthlyRate;
      const principalPayment = Math.min(emi - interestPayment, pBalance);
      pBalance -= principalPayment;
      pTotalInterest += interestPayment;

      if (prepayOn && prepayAmt > 0) {
        let extra = 0;
        if (prepayFreq === "monthly") extra = prepayAmt;
        else if (prepayFreq === "quarterly" && m % 3 === 0) extra = prepayAmt;
        else if (prepayFreq === "annually" && m % 12 === 0) extra = prepayAmt;

        extra = Math.min(extra, pBalance);
        pBalance -= extra;
        pInvestedPrepay += extra;
      }

      if (m % 12 === 0 || pBalance <= 0) {
        prepaySchedule.push({ year: Math.ceil(m / 12), balance: Math.round(pBalance) });
      }
    }

    const compiledChart = baseSchedule.map((d, index) => ({
      year: d.year,
      Standard: d.balance,
      Accelerated: prepaySchedule[index]?.balance ?? 0
    }));

    return {
      emi,
      totalInterest,
      pTotalInterest,
      interestSaved: Math.max(0, totalInterest - pTotalInterest),
      timelineSaved: parseFloat(((totalPayments - actualMonths) / 12).toFixed(1)),
      compiledChart
    };
  }, [principal, rate, tenure, prepayOn, prepayAmt, prepayFreq]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <Field label="Principal Value" value={principal} onChange={setPrincipal} prefix="₹" step={50000} />
          <Field label="Interest Index" value={rate} onChange={setRate} suffix="%" step={0.1} />
          <Field label="Amortization Term" value={tenure} onChange={setTenure} suffix="Yrs" step={1} />
        </div>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="lbl" style={{ marginBottom: 0 }}>Activate Prepayments</span>
            <Toggle on={prepayOn} set={setPrepayOn} color="#f59e0b" />
          </div>
          {prepayOn && (
            <div style={{ marginTop: 12 }}>
              <Field label="Injection Quantum" value={prepayAmt} onChange={setPrepayAmt} prefix="₹" step={2000} color="#f59e0b" />
              <PillRow options={[["monthly", "Monthly"], ["quarterly", "Quarterly"], ["annually", "Annually"]]} value={prepayFreq} set={setPrepayFreq} activeColor="#f59e0b" />
            </div>
          )}
        </div>
      </div>

      <div>
        {results && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div className="card"><h5>Calculated Monthly EMI</h5><h3 style={{ marginTop: 4 }}>{formatINR(results.emi)}</h3></div>
              <div className="card" style={{ background: prepayOn ? "#fffbeb" : "#ffffff" }}><h5>Interest Pool Expense</h5><h3 style={{ marginTop: 4 }}>{formatINR(prepayOn ? results.pTotalInterest : results.totalInterest)}</h3></div>
              {prepayOn && <div className="card" style={{ background: "#f0fdf9" }}><h5>Interest Savings</h5><h3 style={{ marginTop: 4 }}>{formatINR(results.interestSaved)}</h3><span style={{ fontSize: 11, color: "#0d9373" }}>Cleared {results.timelineSaved} years early</span></div>}
            </div>
            <div className="card">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.compiledChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatINR} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Standard" stroke="#64748b" strokeWidth={2} name="Baseline Debt" dot={false} />
                  {prepayOn && <Line type="monotone" dataKey="Accelerated" stroke="#f59e0b" strokeWidth={3} name="Prepaid Debt Path" dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APPLICATION SHELL WRAPPER ──────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div style={{ padding: "24px max(20px, 4.5vw)", maxWidth: 1300, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d0d7de", paddingBottom: 16, marginBottom: 24, gap: 16 }}>
        <div style={{ cursor: "pointer" }} onClick={() => setActiveTab("home")}>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: "#0d9373" }}>Apex Quantum Tools</h2>
          <p style={{ fontSize: 12, color: "#444c56" }}>Engineered Portfolio Forecasting Frameworks</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className={`nav-tab ${activeTab === "home" ? "active" : "inactive"}`} onClick={() => setActiveTab("home")}>🏠 Home</button>
          <button className={`nav-tab ${activeTab === "calc" ? "active" : "inactive"}`} onClick={() => setActiveTab("calc")}>📊 Standard Modules</button>
          <button className={`nav-tab ${activeTab === "market" ? "active" : "inactive"}`} onClick={() => setActiveTab("market")}>📈 Backtest Engine</button>
          <button className={`nav-tab ${activeTab === "emi" ? "active" : "inactive"}`} onClick={() => setActiveTab("emi")}>💳 Amortization</button>
        </div>
      </div>

      <div>
        {activeTab === "home" && <HomeHero setActiveTab={setActiveTab} />}
        {activeTab === "calc" && <CalculatorPage />}
        {activeTab === "market" && <MarketSIPPage />}
        {activeTab === "emi" && <EMIPage />}
      </div>
    </div>
  );
}

```
