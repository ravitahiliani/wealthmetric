import { useState, useMemo } from "react";
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
  .nav-tab{cursor:pointer;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:8px;white-space:nowrap;user-select:none}
  .nav-tab.active{background:#0d9373;color:#ffffff;box-shadow:0 2px 8px rgba(13,147,115,0.3)}
  .nav-tab.inactive{color:#444c56;border:1px solid #d0d7de;background:#ffffff}
  .nav-tab.inactive:hover{color:#1f2328;border-color:#0d9373;background:#f0fdf9}
  .range-track{position:relative;height:6px;background:#d0d7de;border-radius:3px;margin:8px 0}
  .range-fill{position:absolute;height:100%;background:#0d9373;border-radius:3px;pointer-events:none}
  .dual-thumb{position:absolute;width:18px;height:18px;background:#0d9373;border-radius:50%;top:50%;transform:translate(-50%,-50%);cursor:pointer;border:2px solid #ffffff;box-shadow:0 1px 6px rgba(13,147,115,0.4)}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatINR(val) {
  const v=Math.abs(val),s=val<0?"-":"";
  if(v>=10000000) return`${s}₹${(v/10000000).toFixed(2)}Cr`;
  if(v>=100000)   return`${s}₹${(v/100000).toFixed(2)}L`;
  if(v>=1000)     return`${s}₹${(v/1000).toFixed(1)}K`;
  return`${s}₹${Math.round(v).toLocaleString("en-IN")}`;
}
function formatINRFull(val){return`₹${Math.round(Math.abs(val)).toLocaleString("en-IN")}`;}

function Stat({label,value,sub,color="#1f2328",accent}){
  return(
    <div className="card" style={accent?{borderColor:accent+"55",background:`linear-gradient(135deg,${accent}08,#161b22)`}:{}}>
      <div className="lbl" style={{marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"clamp(16px,1.8vw,22px)",color:color||"#1f2328"}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:"#444c56",marginTop:2}}>{sub}</div>}
    </div>
  );
}


// ─── SHARED FIELD / TOGGLE / PILLROW ─────────────────────────────────────────
// Field lives outside page components so it never remounts on re-render
function Field({label,value,onChange,suffix="",prefix="",step=1,min=0,color="#0d9373",hint}){
  const [local,setLocal]=React.useState(String(value??""));
  const focused=React.useRef(false);
  React.useEffect(()=>{
    if(!focused.current) setLocal(String(value??""));
  },[value]);
  const numVal=parseFloat(local);
  const isRupee=prefix==="\u20b9";
  let readable=null;
  if(isRupee&&!isNaN(numVal)&&numVal>=1000){
    if(numVal>=10000000) readable=`${(numVal/10000000).toFixed(2)} Crore`;
    else if(numVal>=100000) readable=`${(numVal/100000).toFixed(2)} Lakh`;
    else readable=`${(numVal/1000).toFixed(1)}K`;
  }
  return(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:10,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600}}>{label}</div>
        {readable&&<div style={{fontSize:11,color:color,fontFamily:"Syne",fontWeight:700,background:"#ffffff",border:`1px solid ${color}33`,borderRadius:5,padding:"1px 8px"}}>{readable}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",background:"#ffffff",border:"1px solid #d0d7de",borderRadius:8,overflow:"hidden",boxShadow:"inset 0 1px 2px rgba(31,35,40,0.04)"}}>
        {prefix&&<span style={{padding:"0 10px",color,fontFamily:"Syne",fontWeight:700,fontSize:14,borderRight:"1px solid #d0d7de",display:"flex",alignItems:"center",background:"#f6f8fa",alignSelf:"stretch"}}>{prefix}</span>}
        <input type="number" value={local} step={step} min={min}
          onFocus={()=>{focused.current=true;}}
          onChange={e=>{
            setLocal(e.target.value);
            const n=parseFloat(e.target.value);
            if(!isNaN(n)) onChange(n);
          }}
          onBlur={e=>{
            focused.current=false;
            const n=parseFloat(e.target.value);
            if(isNaN(n)||e.target.value==="") setLocal(String(value??""));
            else{onChange(n);setLocal(String(n));}
          }}
          style={{flex:1,background:"transparent",border:"none",color:"#1f2328",padding:"9px 12px",fontSize:15,fontFamily:"Syne",fontWeight:700,outline:"none",width:"100%"}}/>
        {suffix&&<span style={{padding:"0 12px",color:"#444c56",fontSize:12,whiteSpace:"nowrap"}}>{suffix}</span>}
      </div>
      {hint&&<div style={{fontSize:10,color:"#444c56",marginTop:4}}>{hint}</div>}
    </div>
  );
}

function Toggle({on,set,color="#0d9373"}){
  return(
    <div className="toggle-sw" style={{background:on?color:"#d0d7de"}} onClick={()=>set(p=>!p)}>
      <div className="toggle-kn" style={{transform:on?"translateX(17px)":"translateX(0)"}}/>
    </div>
  );
}

function PillRow({options,value,set,activeColor}){
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {options.map(([k,label])=>(
        <div key={k} className={`pill ${value===k?"on":"off"}`}
          style={value===k&&activeColor?{background:activeColor,borderColor:activeColor,color:"#f6f8fa"}:{}}
          onClick={()=>set(k)}>{label}</div>
      ))}
    </div>
  );
}

// ─── NUMINPUT: compact inline number input with local string state ────────────
// Use this for any raw <input type="number"> that doesn't need prefix/suffix labels
// Prevents the focus-loss bug by holding local string state while typing
function NumInput({value,onChange,step=1,min=0,max,style={},color="#1f2328",suffix}){
  const [local,setLocal]=React.useState(String(value??""));
  const focused=React.useRef(false);
  React.useEffect(()=>{
    if(!focused.current) setLocal(String(value??""));
  },[value]);
  return(
    <div style={{display:"flex",alignItems:"center",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:7,overflow:"hidden",...(style.wrapper||{})}}>
      <input type="number" value={local} step={step} min={min} max={max}
        onFocus={()=>{focused.current=true;}}
        onChange={e=>{
          setLocal(e.target.value);
          const n=parseFloat(e.target.value);
          if(!isNaN(n)) onChange(n);
        }}
        onBlur={e=>{
          focused.current=false;
          const n=parseFloat(e.target.value);
          if(isNaN(n)||e.target.value==="") setLocal(String(value??""));
          else{onChange(n);setLocal(String(n));}
        }}
        style={{flex:1,background:"transparent",border:"none",color,padding:"7px 8px",
          fontSize:style.fontSize||14,fontFamily:"Syne",fontWeight:700,outline:"none",width:"100%",minWidth:0,...(style.input||{})}}/>
      {suffix&&<span style={{padding:"0 8px",color:"#444c56",fontSize:11,whiteSpace:"nowrap"}}>{suffix}</span>}
    </div>
  );
}

// ─── SHARED TOOLTIP + TIPBOX ─────────────────────────────────────────────────
function ChartTooltip({active,payload,label,labelPrefix=""}){
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"#1f2328",border:"1px solid #374151",borderRadius:9,padding:"11px 15px",minWidth:190,boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
      <p style={{color:"#e5e7eb",fontWeight:700,marginBottom:6,fontSize:10,letterSpacing:"1px",textTransform:"uppercase"}}>{labelPrefix}{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||p.fill,fontSize:12,margin:"3px 0",display:"flex",justifyContent:"space-between",gap:16,filter:"brightness(1.2)"}}>
          <span>{p.name}</span><span style={{fontFamily:"Syne",fontWeight:700}}>{typeof p.value==="number"?formatINR(p.value):p.value}</span>
        </p>
      ))}
    </div>
  );
}
function TipBox({children,color="#3b82f620"}){
  return(
    <div style={{background:"#eff6ff",border:`1px solid ${color}`,borderRadius:7,padding:"8px 11px",fontSize:10,color:"#444c56",lineHeight:1.7,marginBottom:14}}>
      {children}
    </div>
  );
}

// ─── YEAR RANGE SLIDER ────────────────────────────────────────────────────────
function YearRangeSlider({startYear,endYear,onStartChange,onEndChange,min=2000,max=2024}){
  const pct = v => ((v-min)/(max-min))*100;
  return(
    <div style={{padding:"0 2px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"#0d9373"}}>{startYear}</span>
        <span style={{fontSize:11,color:"#444c56"}}>to</span>
        <span style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"#0d9373"}}>{endYear}</span>
      </div>
      <div style={{position:"relative",height:20,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:4,background:"#d0d7de",borderRadius:2}}/>
        <div style={{
          position:"absolute",
          left:`${pct(startYear)}%`,
          right:`${100-pct(endYear)}%`,
          height:4,background:"#0d9373",borderRadius:2
        }}/>
        <input type="range" min={min} max={max} step={1} value={startYear}
          onChange={e=>onStartChange(Math.min(Number(e.target.value),endYear-1))}
          style={{position:"absolute",width:"100%",opacity:0,cursor:"pointer",zIndex:2,height:20}}
        />
        <input type="range" min={min} max={max} step={1} value={endYear}
          onChange={e=>onEndChange(Math.max(Number(e.target.value),startYear+1))}
          style={{position:"absolute",width:"100%",opacity:0,cursor:"pointer",zIndex:3,height:20}}
        />
        <div style={{position:"absolute",left:`${pct(startYear)}%`,width:16,height:16,background:"#0d9373",borderRadius:"50%",transform:"translateX(-50%)",border:"2px solid #0d1117",boxShadow:"0 0 8px #10b98166",zIndex:4,pointerEvents:"none"}}/>
        <div style={{position:"absolute",left:`${pct(endYear)}%`,width:16,height:16,background:"#0d9373",borderRadius:"50%",transform:"translateX(-50%)",border:"2px solid #0d1117",boxShadow:"0 0 8px #10b98166",zIndex:4,pointerEvents:"none"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:"#444c56"}}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ─── SIP DATA & LOGIC ─────────────────────────────────────────────────────────
const BASE_RETURNS=[
  -0.052,-0.091,-0.082,-0.038,-0.062,0.041,0.018,-0.023,-0.071,-0.031,-0.028,-0.019,
  -0.041,-0.031,-0.062,-0.018,0.028,-0.041,-0.031,-0.072,-0.091,0.031,0.062,0.041,
   0.018,-0.021,0.031,-0.041,-0.018,0.051,-0.028,-0.041,-0.051,0.018,0.031,0.041,
   0.041,-0.018,-0.031,0.062,0.051,0.028,0.041,0.071,0.082,0.091,0.062,0.108,
   0.018,0.051,0.028,-0.171,0.041,0.028,0.031,0.018,0.051,0.018,0.082,0.041,
   0.062,0.028,0.071,0.051,0.028,0.082,0.041,0.062,0.091,0.028,0.071,0.082,
   0.121,0.051,0.082,0.041,-0.141,-0.031,0.028,0.091,0.062,0.041,0.028,0.071,
   0.018,-0.028,0.031,0.062,0.051,0.028,0.041,0.031,0.121,0.151,-0.051,0.091,
  -0.121,-0.031,-0.141,0.091,0.028,-0.191,0.041,-0.031,-0.121,-0.241,-0.051,0.071,
  -0.028,-0.051,-0.031,0.151,0.281,0.021,0.091,0.018,0.062,-0.071,0.051,0.031,
   0.062,0.028,0.071,0.051,-0.031,0.021,0.018,0.028,0.091,0.051,-0.021,0.041,
  -0.091,-0.031,0.021,-0.041,-0.031,-0.021,-0.031,-0.081,-0.031,-0.091,-0.091,-0.021,
   0.121,-0.018,0.018,0.041,-0.061,0.021,0.051,0.018,0.071,0.041,0.051,0.028,
   0.028,-0.051,-0.021,0.041,-0.031,-0.051,-0.018,-0.041,0.031,0.091,0.028,0.018,
   0.018,0.028,0.051,0.018,0.031,0.041,0.028,0.018,-0.028,-0.041,0.031,-0.018,
   0.062,-0.051,-0.041,0.031,0.021,-0.021,0.018,-0.061,-0.071,-0.031,-0.018,-0.021,
  -0.051,-0.071,0.101,0.018,0.041,0.021,0.028,0.041,-0.021,-0.018,-0.041,0.031,
   0.041,0.028,0.031,0.018,0.021,0.018,0.051,0.031,0.028,0.062,0.021,0.031,
   0.051,-0.031,-0.031,0.041,0.021,0.018,0.028,0.031,-0.071,-0.051,0.051,-0.071,
   0.051,0.021,0.081,0.018,0.021,0.018,0.041,-0.021,0.041,0.038,-0.051,0.071,
  -0.061,-0.061,-0.231,0.141,0.051,0.071,0.111,0.028,-0.018,-0.031,0.111,0.071,
  -0.021,0.061,0.011,0.031,0.051,0.001,-0.001,0.091,0.031,0.001,-0.041,0.021,
  -0.021,0.031,0.041,-0.021,-0.041,-0.048,0.082,-0.028,0.038,0.051,-0.001,-0.038,
  -0.028,-0.018,0.021,0.041,0.028,0.051,0.031,-0.021,0.018,0.041,0.051,0.071,
  -0.001,0.028,0.018,0.041,0.028,0.071,0.041,0.018,0.028,-0.061,0.021,0.031,
];

const ASSET_PROFILES={
  nifty50:    {label:"Nifty 50",      short:"N50", color:"#0d9373",group:"index", startPrice:1528, mult:1.00,vol:0.000,drift:0.0000},
  banknifty:  {label:"Bank Nifty",    short:"BNK", color:"#3b82f6",group:"index", startPrice:2800, mult:1.30,vol:0.008,drift:0.0005},
  midcap150:  {label:"Midcap 150",    short:"MID", color:"#f59e0b",group:"index", startPrice:2200, mult:1.20,vol:0.006,drift:0.0008},
  smallcap250:{label:"Smallcap 250",  short:"SML", color:"#ec4899",group:"index", startPrice:1800, mult:1.35,vol:0.010,drift:0.0010},
  niftyit:    {label:"Nifty IT",      short:"IT",  color:"#a78bfa",group:"index", startPrice:1100, mult:1.15,vol:0.009,drift:0.0006},
  niftypharma:{label:"Nifty Pharma",  short:"PHR", color:"#fb923c",group:"index", startPrice:1300, mult:1.10,vol:0.007,drift:0.0004},
  sp500:      {label:"S&P 500",       short:"SPX", color:"#06b6d4",group:"global",startPrice:1469, mult:0.85,vol:0.005,drift:0.0003},
  nasdaq:     {label:"Nasdaq 100",    short:"NDX", color:"#818cf8",group:"global",startPrice:3700, mult:1.05,vol:0.008,drift:0.0005},
  gold:       {label:"Gold",          short:"GLD", color:"#fbbf24",group:"commod",startPrice:4500, mult:0.55,vol:0.004,drift:0.0006},
  silver:     {label:"Silver",        short:"SLV", color:"#94a3b8",group:"commod",startPrice:8000, mult:0.65,vol:0.012,drift:0.0002},
  reliance:   {label:"Reliance",      short:"REL", color:"#f97316",group:"stock", startPrice:220,  mult:1.25,vol:0.009,drift:0.0008},
  tcs:        {label:"TCS",           short:"TCS", color:"#22d3ee",group:"stock", startPrice:180,  mult:1.30,vol:0.007,drift:0.0009},
  hdfcbank:   {label:"HDFC Bank",     short:"HDF", color:"#4ade80",group:"stock", startPrice:140,  mult:1.20,vol:0.008,drift:0.0007},
  infy:       {label:"Infosys",       short:"INF", color:"#c084fc",group:"stock", startPrice:160,  mult:1.28,vol:0.008,drift:0.0009},
  icicibank:  {label:"ICICI Bank",    short:"ICI", color:"#f472b6",group:"stock", startPrice:90,   mult:1.35,vol:0.010,drift:0.0010},
  hindunilvr: {label:"HUL",           short:"HUL", color:"#059669",group:"stock", startPrice:200,  mult:1.10,vol:0.005,drift:0.0005},
  sbin:       {label:"SBI",           short:"SBI", color:"#7dd3fc",group:"stock", startPrice:80,   mult:1.30,vol:0.011,drift:0.0008},
  bajfinance: {label:"Bajaj Finance", short:"BAJ", color:"#fb7185",group:"stock", startPrice:120,  mult:1.60,vol:0.014,drift:0.0015},
  wipro:      {label:"Wipro",         short:"WIP", color:"#a5f3fc",group:"stock", startPrice:100,  mult:1.20,vol:0.008,drift:0.0007},
  titan:      {label:"Titan",         short:"TTN", color:"#f0abfc",group:"stock", startPrice:150,  mult:1.45,vol:0.010,drift:0.0012},
  maruti:     {label:"Maruti",        short:"MAR", color:"#fca5a5",group:"stock", startPrice:400,  mult:1.18,vol:0.009,drift:0.0007},
  axisbank:   {label:"Axis Bank",     short:"AXS", color:"#86efac",group:"stock", startPrice:110,  mult:1.25,vol:0.010,drift:0.0009},
  lt:         {label:"L&T",           short:"L&T", color:"#34d399",group:"stock", startPrice:250,  mult:1.22,vol:0.008,drift:0.0008},
  kotakbank:  {label:"Kotak Bank",    short:"KOT", color:"#93c5fd",group:"stock", startPrice:130,  mult:1.28,vol:0.009,drift:0.0009},
  asianpaint: {label:"Asian Paints",  short:"ASN", color:"#fde047",group:"stock", startPrice:190,  mult:1.20,vol:0.007,drift:0.0008},
  fd:         {label:"Fixed Deposit", short:"FD",  color:"#64748b",group:"fixed", isFixed:true},
  bond:       {label:"Gov Bond",      short:"BND", color:"#78716c",group:"fixed", isFixed:true},
};

const GROUPS={
  index: {label:"Indian Indices",icon:"📈"},
  global:{label:"Global",        icon:"🌍"},
  commod:{label:"Commodities",   icon:"🥇"},
  stock: {label:"Top Stocks",    icon:"🏢"},
  fixed: {label:"Fixed Returns", icon:"🏦"},
};

const SIP_FREQS={
  daily:      {label:"Daily",       perMonth:22},
  weekly:     {label:"Weekly",      perMonth:4.33},
  monthly:    {label:"Monthly",     perMonth:1},
  quarterly:  {label:"Quarterly",   perMonth:1/3},
  halfyearly: {label:"Half Yearly", perMonth:1/6},
  annually:   {label:"Annually",    perMonth:1/12},
};

const STEPUP_FREQS={
  none:      {label:"None",       everyN:0},
  monthly:   {label:"Monthly",    everyN:1},
  quarterly: {label:"Quarterly",  everyN:3},
  halfyearly:{label:"Half Yearly",everyN:6},
  annually:  {label:"Annually",   everyN:12},
};

function addMonths(yr,mo,n){
  const d=new Date(yr,mo-1+n,1);
  return{yr:d.getFullYear(),mo:d.getMonth()+1};
}
function monthsBetween(sy,sm,ey,em){return(ey-sy)*12+(em-sm);}

function generateAssetData(key){
  const p=ASSET_PROFILES[key];
  if(p.isFixed) return null;
  const data={};
  let price=p.startPrice,idx=0;
  let seed=key.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rng=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let yr=2000;yr<=2024;yr++){
    for(let mo=1;mo<=12;mo++){
      const base=BASE_RETURNS[idx]||0;
      const noise=(rng()-0.5)*2*p.vol;
      price=Math.max(price*(1+base*p.mult+noise+p.drift),p.startPrice*0.05);
      data[`${yr}-${String(mo).padStart(2,"0")}`]=Math.round(price*100)/100;
      idx++;
    }
  }
  return data;
}
const ALL_DATA={};
Object.keys(ASSET_PROFILES).forEach(k=>{ALL_DATA[k]=generateAssetData(k);});

function calcXIRR(cfs){
  let rate=0.12;
  for(let i=0;i<2000;i++){
    let f=0,df=0;
    const t0=cfs[0].date.getTime();
    for(const c of cfs){
      const t=(c.date.getTime()-t0)/(365.25*864e5);
      const d=Math.pow(1+rate,t);
      f+=c.amount/d;df+=(-t*c.amount)/(d*(1+rate));
    }
    if(Math.abs(df)<1e-12)break;
    const nr=rate-f/df;
    if(Math.abs(nr-rate)<1e-8)return nr;
    rate=isFinite(nr)?Math.max(-0.99,Math.min(nr,100)):rate;
  }
  return rate;
}

function calcFixedCorpus(sipAmount,sipFreq,stepUpFreq,stepUpType,stepUpPct,stepUpAmt,fixedRate,startYr,startMo,endYr,endMo){
  const total=monthsBetween(startYr,startMo,endYr,endMo)+1;
  const everyN=STEPUP_FREQS[stepUpFreq].everyN;
  const mr=Math.pow(1+fixedRate/100,1/12)-1;
  let corpus=0,amt=sipAmount,msSU=0;
  for(let i=0;i<total;i++){
    const {yr,mo}=addMonths(startYr,startMo,i);
    if(everyN>0&&i>0){msSU++;if(msSU>=everyN){msSU=0;amt=stepUpType==="percent"?amt*(1+stepUpPct/100):amt+stepUpAmt;}}
    let invest=false;
    if(["daily","weekly","monthly"].includes(sipFreq)) invest=true;
    else if(sipFreq==="quarterly"&&mo%3===1) invest=true;
    else if(sipFreq==="halfyearly"&&mo%6===1) invest=true;
    else if(sipFreq==="annually"&&mo===1) invest=true;
    if(invest) corpus+=amt*Math.pow(1+mr,total-i-1);
  }
  return corpus;
}

function simulateAsset({key,sipAmount,sipFreq,startYr,startMo,endYr,endMo,stepUpFreq,stepUpType,stepUpPct,stepUpAmt,fixedRate}){
  const p=ASSET_PROFILES[key];
  const total=monthsBetween(startYr,startMo,endYr,endMo)+1;
  if(total<2) return null;
  const everyN=STEPUP_FREQS[stepUpFreq].everyN;
  let amt=sipAmount,invested=0,units=0,msSU=0;
  const cfs=[],yearData=[];
  for(let i=0;i<total;i++){
    const {yr,mo}=addMonths(startYr,startMo,i);
    if(everyN>0&&i>0){msSU++;if(msSU>=everyN){msSU=0;amt=stepUpType==="percent"?amt*(1+stepUpPct/100):amt+stepUpAmt;}}
    let count=1;
    if(sipFreq==="daily") count=22;
    else if(sipFreq==="weekly") count=4;
    else if(sipFreq==="quarterly"&&mo%3!==1) count=0;
    else if(sipFreq==="halfyearly"&&mo%6!==1) count=0;
    else if(sipFreq==="annually"&&mo!==1) count=0;
    const mKey=`${yr}-${String(mo).padStart(2,"0")}`;
    for(let inv=0;inv<count;inv++){
      if(!p.isFixed){
        const px=ALL_DATA[key]?.[mKey]||0;
        if(!px) continue;
        units+=amt/px;
      }
      invested+=amt;
      cfs.push({date:new Date(yr,mo-1,1+Math.round((inv/Math.max(count,1))*27)),amount:-amt});
    }
    if(mo===12||i===total-1){
      let corpus;
      if(p.isFixed) corpus=calcFixedCorpus(sipAmount,sipFreq,stepUpFreq,stepUpType,stepUpPct,stepUpAmt,fixedRate,startYr,startMo,yr,mo);
      else{const px=ALL_DATA[key]?.[mKey]||0;corpus=units*px;}
      yearData.push({year:yr,invested:Math.round(invested),corpus:Math.round(corpus)});
    }
  }
  const endKey=`${endYr}-${String(endMo).padStart(2,"0")}`;
  let finalCorpus;
  if(p.isFixed) finalCorpus=calcFixedCorpus(sipAmount,sipFreq,stepUpFreq,stepUpType,stepUpPct,stepUpAmt,fixedRate,startYr,startMo,endYr,endMo);
  else{const fp=ALL_DATA[key]?.[endKey]||0;finalCorpus=units*fp;}
  cfs.push({date:new Date(endYr,endMo-1,1),amount:finalCorpus});
  let xirr=0;try{xirr=calcXIRR(cfs)*100;}catch(e){}
  return{totalInvested:invested,finalCorpus,absoluteReturn:((finalCorpus-invested)/invested)*100,xirr,yearData};
}


// ─── CALCULATOR PAGE (Tab 1: Pure user-input based) ───────────────────────────
function CalculatorPage(){
  const [mode,setMode]=useState("calculate"); // "calculate" | "findsip"

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [annualRate,setAnnualRate]=useState(12);
  const [years,setYears]=useState(10);

  // ── Calculate mode ─────────────────────────────────────────────────────────
  const [lumpsum,setLumpsum]=useState(100000);
  const [sipOn,setSipOn]=useState(true);
  const [sipAmt,setSipAmt]=useState(10000);
  const [sipFreqKey,setSipFreqKey]=useState("monthly");
  const [stepPct,setStepPct]=useState(0);
  const [stepFreq,setStepFreq]=useState("annually");

  // ── Find SIP mode ──────────────────────────────────────────────────────────
  const [targetCorpus,setTargetCorpus]=useState(5000000);
  const [fsLumpsum,setFsLumpsum]=useState(100000);
  const [fsSipFreqKey,setFsSipFreqKey]=useState("monthly");
  const [fsStepPct,setFsStepPct]=useState(0);
  const [fsStepFreq,setFsStepFreq]=useState("annually");

  // ── Calculate mode results ─────────────────────────────────────────────────
  const rate=Number(annualRate)||0;
  const totalYears=Number(years)||0;
  const totalMonths=Math.round(totalYears*12);
  const mr=Math.pow(1+rate/100,1/12)-1;

  const calcResults=useMemo(()=>{
    if(totalMonths<1) return null;
    let lsCorpus=Number(lumpsum)||0;
    const sipMonthly=(sipOn&&sipAmt>0)?(sipAmt*(SIP_FREQS[sipFreqKey]?.perMonth||1)):0;
    const everyN=STEPUP_FREQS[stepFreq]?.everyN||12;
    let sipCorpus=0,sipInvested=0,sipCurrentAmt=sipMonthly,sipMsSU=0;
    const yearData=[];
    for(let m=1;m<=totalMonths;m++){
      lsCorpus=lsCorpus*(1+mr);
      if(sipMonthly>0){
        if(stepPct>0&&m>1){sipMsSU++;if(sipMsSU>=everyN){sipMsSU=0;sipCurrentAmt=sipCurrentAmt*(1+stepPct/100);}}
        sipCorpus=(sipCorpus+sipCurrentAmt)*(1+mr);
        sipInvested+=sipCurrentAmt;
      }
      if(m%12===0||m===totalMonths){
        const yr=parseFloat((m/12).toFixed(2));
        const lsInv=Number(lumpsum)||0;
        yearData.push({yr,lsCorpus:Math.round(lsCorpus),sipCorpus:Math.round(sipCorpus),
          lsInvested:Math.round(lsInv),sipInvested:Math.round(sipInvested),
          totalCorpus:Math.round(lsCorpus+(sipOn?sipCorpus:0)),
          totalInvested:Math.round(lsInv+(sipOn?sipInvested:0))});
      }
    }
    const lsInv=Number(lumpsum)||0;
    let sipXirr=rate;
    if(sipMonthly>0&&sipCorpus>0){
      let a=sipMonthly,ms2=0;
      const cfs=[];
      for(let m2=1;m2<=totalMonths;m2++){
        if(stepPct>0&&m2>1){ms2++;if(ms2>=everyN){ms2=0;a=a*(1+stepPct/100);}}
        cfs.push({date:new Date(2015,m2-1,1),amount:-a});
      }
      cfs.push({date:new Date(2015,totalMonths,1),amount:sipCorpus});
      try{sipXirr=calcXIRR(cfs)*100;}catch(e){}
    }
    const totalInv=lsInv+(sipOn?sipInvested:0);
    const totalCorp=lsCorpus+(sipOn?sipCorpus:0);
    return{yearData,
      ls:{invested:lsInv,corpus:Math.round(lsCorpus),gain:Math.round(lsCorpus-lsInv)},
      sip:{invested:Math.round(sipInvested),corpus:Math.round(sipCorpus),gain:Math.round(sipCorpus-sipInvested),xirr:sipXirr},
      total:{invested:Math.round(totalInv),corpus:Math.round(totalCorp),gain:Math.round(totalCorp-totalInv)}};
  },[lumpsum,sipOn,sipAmt,sipFreqKey,stepPct,stepFreq,rate,totalMonths]);

  // ── Find SIP mode results ──────────────────────────────────────────────────
  const findSipResults=useMemo(()=>{
    if(totalMonths<1||targetCorpus<=0) return null;
    const preR=mr;
    const everyN=STEPUP_FREQS[fsStepFreq]?.everyN||12;
    const freqMult=SIP_FREQS[fsSipFreqKey]?.perMonth||1;
    // Lumpsum growth
    const lsGrowth=(Number(fsLumpsum)||0)*Math.pow(1+rate/100,totalYears);
    const sipTarget=Math.max(0,targetCorpus-lsGrowth);

    // Flat SIP needed (no step-up)
    // FV = SIP * freqMult * [(1+r)^n - 1]/r * (1+r)
    const flatSipPerPeriod=sipTarget>0&&totalMonths>0
      ?(sipTarget*preR)/((Math.pow(1+preR,totalMonths)-1)*(1+preR)/freqMult)
      :0;

    // Step-up SIP needed: binary search
    let stepSipPerPeriod=flatSipPerPeriod;
    if(fsStepPct>0&&sipTarget>0){
      let lo=0,hi=flatSipPerPeriod*5;
      for(let iter=0;iter<80;iter++){
        const mid=(lo+hi)/2;
        let c=0,amt=mid*freqMult,ms=0;
        for(let m=1;m<=totalMonths;m++){
          if(m>1){ms++;if(ms>=everyN){ms=0;amt=amt*(1+fsStepPct/100);}}
          c=(c+amt)*(1+preR);
        }
        if(c<sipTarget) lo=mid; else hi=mid;
      }
      stepSipPerPeriod=(lo+hi)/2;
    }

    const effectiveSip=fsStepPct>0?stepSipPerPeriod:flatSipPerPeriod;
    const effectiveSipMonthly=effectiveSip*freqMult;

    // Year data for chart
    let lsC=Number(fsLumpsum)||0;
    let sipC=0,sipInv=0,sipAmt2=effectiveSipMonthly,msSU=0;
    const yearData=[];
    for(let m=1;m<=totalMonths;m++){
      lsC=lsC*(1+preR);
      if(fsStepPct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt2=sipAmt2*(1+fsStepPct/100);}}
      sipC=(sipC+sipAmt2)*(1+preR);
      sipInv+=sipAmt2;
      if(m%12===0||m===totalMonths){
        yearData.push({yr:parseFloat((m/12).toFixed(2)),
          lsCorpus:Math.round(lsC),sipCorpus:Math.round(sipC),
          totalCorpus:Math.round(lsC+sipC),
          totalInvested:Math.round((Number(fsLumpsum)||0)+sipInv),
          target:targetCorpus});
      }
    }

    // Comparison table at different step-up %
    const variants=[0,5,10,15,20].map(spct=>{
      if(spct===0){
        return{stepPct:spct,sipPerPeriod:flatSipPerPeriod,label:"No step-up"};
      }
      let lo=0,hi=flatSipPerPeriod*5;
      const evN=STEPUP_FREQS[fsStepFreq]?.everyN||12;
      for(let iter=0;iter<80;iter++){
        const mid=(lo+hi)/2;
        let c=0,amt=mid*freqMult,ms=0;
        for(let m=1;m<=totalMonths;m++){
          if(m>1){ms++;if(ms>=evN){ms=0;amt=amt*(1+spct/100);}}
          c=(c+amt)*(1+preR);
        }
        if(c<sipTarget) lo=mid; else hi=mid;
      }
      return{stepPct:spct,sipPerPeriod:(lo+hi)/2,label:`${spct}% step-up`};
    });

    return{effectiveSip,effectiveSipMonthly,flatSipPerPeriod,lsGrowth,sipTarget,
      yearData,variants,freqLabel:SIP_FREQS[fsSipFreqKey]?.label||"Monthly"};
  },[targetCorpus,fsLumpsum,fsSipFreqKey,fsStepPct,fsStepFreq,rate,totalMonths,mr,totalYears]);

  const hasCalcResults=calcResults&&totalMonths>0;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Mode switcher */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[
          {k:"calculate",icon:"🧮",label:"Calculate",    desc:"What will my investments grow to?"},
          {k:"findsip",  icon:"🎯",label:"Find SIP",     desc:"What SIP do I need to reach a target?"},
        ].map(m=>(
          <div key={m.k} onClick={()=>setMode(m.k)}
            style={{padding:"10px 20px",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:8,
              transition:"all 0.2s",background:mode===m.k?"#0d9373":"#ffffff",
              color:mode===m.k?"#f6f8fa":"#6b7280",border:`1px solid ${mode===m.k?"#0d9373":"#d0d7de"}`}}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:13}}>{m.label}</div>
              <div style={{fontSize:10,opacity:0.7}}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:18,alignItems:"start"}}>

        {/* ── LEFT ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Shared settings */}
          <div className="card" style={{borderColor:"#ffffff14"}}>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>Shared Settings</div>
            <Field label="Annual Return %" value={annualRate} onChange={setAnnualRate} suffix="% p.a." step={0.1} min={0} color="#0d9373" hint="Applies to lumpsum + SIP"/>
            <Field label="Time Horizon" value={years} onChange={setYears} suffix="years" step={0.5} min={0.5} color="#0d9373" hint="Decimals allowed — e.g. 7.5"/>
          </div>

          {/* ── CALCULATE mode inputs ── */}
          {mode==="calculate"&&(<>
            <div className="card" style={{borderColor:"#10b98130"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:8,height:8,borderRadius:2,background:"#0d9373",flexShrink:0}}/>
                <span style={{fontFamily:"Syne",fontWeight:800,fontSize:13,color:"#0d9373",flex:1}}>Lumpsum</span>
                <span style={{fontSize:10,color:"#444c56",background:"#ffffff",padding:"2px 7px",borderRadius:4}}>always on</span>
              </div>
              <Field label="One-time Investment" value={lumpsum} onChange={setLumpsum} prefix="₹" step={1000} min={0} color="#0d9373"/>
            </div>

            <div className="card" style={{borderColor:sipOn?"#3b82f630":"#d0d7de"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sipOn?14:0}}>
                <div style={{width:8,height:8,borderRadius:2,background:"#3b82f6",flexShrink:0}}/>
                <span style={{fontFamily:"Syne",fontWeight:800,fontSize:13,color:"#3b82f6",flex:1}}>SIP</span>
                <Toggle on={sipOn} set={setSipOn} color="#3b82f6"/>
              </div>
              {sipOn&&(<>
                <div style={{height:1,background:"#d0d7de",marginBottom:14}}/>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:7}}>Frequency</div>
                  <PillRow options={Object.entries(SIP_FREQS).map(([k,v])=>[k,v.label])} value={sipFreqKey} set={setSipFreqKey} activeColor="#3b82f6"/>
                </div>
                <Field label={`${SIP_FREQS[sipFreqKey]?.label||"Monthly"} Amount`} value={sipAmt} onChange={setSipAmt} prefix="₹" step={100} min={0} color="#3b82f6"/>
                <div style={{height:1,background:"#d0d7de",margin:"4px 0 14px"}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:stepPct>0?10:0}}>
                  <div>
                    <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Step-Up %</div>
                    <NumInput value={stepPct} onChange={v=>setStepPct(v)} step={1} min={0} max={100} suffix="%" color={stepPct>0?"#f59e0b":"#1f2328"} style={{input:{padding:"9px 12px",fontSize:15}}}/>
                    <div style={{fontSize:10,color:"#444c56",marginTop:4}}>0 = no step-up</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Every</div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>(
                        <div key={k} onClick={()=>setStepFreq(k)}
                          style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",opacity:stepPct>0?1:0.3,pointerEvents:stepPct>0?"auto":"none"}}>
                          <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${stepFreq===k&&stepPct>0?"#f59e0b":"#d0d7de"}`,
                            background:stepFreq===k&&stepPct>0?"#f59e0b":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {stepFreq===k&&stepPct>0&&<div style={{width:4,height:4,borderRadius:"50%",background:"#f6f8fa"}}/>}
                          </div>
                          <span style={{fontSize:11,color:stepFreq===k&&stepPct>0?"#f59e0b":"#6b7280"}}>{v.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {stepPct>0&&<div style={{background:"#fffbeb",border:"1px solid #f59e0b30",borderRadius:7,padding:"7px 11px",fontSize:11,color:"#f59e0b"}}>
                  ↑ SIP increases by <strong>{stepPct}%</strong> every <strong>{STEPUP_FREQS[stepFreq]?.label?.toLowerCase()}</strong>
                </div>}
              </>)}
            </div>
          </>)}

          {/* ── FIND SIP mode inputs ── */}
          {mode==="findsip"&&(<>
            <div className="card" style={{borderColor:"#a78bfa30"}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#a78bfa",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>Target</div>
              <Field label="Target Corpus" value={targetCorpus} onChange={setTargetCorpus} prefix="₹" step={100000} min={0} color="#a78bfa"
                hint="The final amount you want to accumulate"/>
            </div>

            <div className="card" style={{borderColor:"#10b98130"}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>Lumpsum (optional)</div>
              <Field label="One-time Investment at Start" value={fsLumpsum} onChange={setFsLumpsum} prefix="₹" step={1000} min={0} color="#0d9373"
                hint="This grows independently. SIP covers the remaining gap."/>
            </div>

            <div className="card" style={{borderColor:"#3b82f630"}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#3b82f6",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>SIP Settings</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:7}}>Frequency</div>
                <PillRow options={Object.entries(SIP_FREQS).map(([k,v])=>[k,v.label])} value={fsSipFreqKey} set={setFsSipFreqKey} activeColor="#3b82f6"/>
              </div>
              <div style={{height:1,background:"#d0d7de",margin:"4px 0 14px"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:fsStepPct>0?10:0}}>
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Step-Up %</div>
                  <NumInput value={fsStepPct} onChange={v=>setFsStepPct(v)} step={1} min={0} max={100} suffix="%" color={fsStepPct>0?"#f59e0b":"#1f2328"} style={{input:{padding:"9px 12px",fontSize:15}}}/>
                  <div style={{fontSize:10,color:"#444c56",marginTop:4}}>0 = no step-up</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Every</div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>(
                      <div key={k} onClick={()=>setFsStepFreq(k)}
                        style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",opacity:fsStepPct>0?1:0.3,pointerEvents:fsStepPct>0?"auto":"none"}}>
                        <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${fsStepFreq===k&&fsStepPct>0?"#f59e0b":"#d0d7de"}`,
                          background:fsStepFreq===k&&fsStepPct>0?"#f59e0b":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {fsStepFreq===k&&fsStepPct>0&&<div style={{width:4,height:4,borderRadius:"50%",background:"#f6f8fa"}}/>}
                        </div>
                        <span style={{fontSize:11,color:fsStepFreq===k&&fsStepPct>0?"#f59e0b":"#6b7280"}}>{v.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {fsStepPct>0&&<div style={{background:"#fffbeb",border:"1px solid #f59e0b30",borderRadius:7,padding:"7px 11px",fontSize:11,color:"#f59e0b"}}>
                ↑ SIP increases {fsStepPct}% every {STEPUP_FREQS[fsStepFreq]?.label?.toLowerCase()}
              </div>}
            </div>
          </>)}
        </div>

        {/* ── RIGHT ── */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* ═══ CALCULATE results ═══ */}
          {mode==="calculate"&&(<>
            {!hasCalcResults&&(
              <div className="card" style={{textAlign:"center",padding:"40px 20px",color:"#444c56"}}>
                <div style={{fontSize:32,marginBottom:10}}>🧮</div>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>Enter your inputs to see results</div>
              </div>
            )}
            {hasCalcResults&&(<>
              <div style={{background:"linear-gradient(135deg,#0d1a14,#0d1a14)",border:"1px solid #10b98130",borderRadius:12,padding:"16px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:16}}>
                {[
                  ["Total Invested",formatINR(calcResults.total.invested),"#0d9373"],
                  ["Total Corpus",formatINR(calcResults.total.corpus),"#0d9373"],
                  ["Total Gain",formatINR(calcResults.total.gain),calcResults.total.gain>=0?"#34d399":"#ef4444"],
                  ["Gain %",(calcResults.total.invested>0?(calcResults.total.gain/calcResults.total.invested*100):0).toFixed(1)+"%",calcResults.total.gain>=0?"#a7f3d0":"#fca5a5"],
                ].map(([l,v,c])=>(
                  <div key={l}>
                    <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>{l}</div>
                    <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(15px,1.5vw,20px)",color:c}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                <div className="card" style={{borderColor:"#10b98130",background:"linear-gradient(135deg,#10b98108,#161b22)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:"#0d9373"}}/>
                    <span style={{fontSize:11,color:"#0d9373",fontWeight:700}}>Lumpsum</span>
                  </div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:"#0d9373",marginBottom:2}}>{formatINR(calcResults.ls.corpus)}</div>
                  <div style={{fontSize:10,color:"#444c56"}}>Invested: {formatINR(calcResults.ls.invested)}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                    <div><div style={{fontSize:9,color:"#444c56"}}>GAIN</div><div style={{fontWeight:700,fontSize:12,color:"#34d399"}}>{formatINR(calcResults.ls.gain)}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#444c56"}}>CAGR</div><div style={{fontWeight:700,fontSize:12,color:"#a7f3d0"}}>{rate}%</div></div>
                  </div>
                </div>
                {sipOn&&(
                  <div className="card" style={{borderColor:"#3b82f630",background:"linear-gradient(135deg,#3b82f608,#161b22)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:"#3b82f6"}}/>
                      <span style={{fontSize:11,color:"#3b82f6",fontWeight:700}}>
                        SIP — {SIP_FREQS[sipFreqKey]?.label}
                        {stepPct>0&&<span style={{color:"#f59e0b",marginLeft:5}}>+{stepPct}% step-up</span>}
                      </span>
                    </div>
                    <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:"#3b82f6",marginBottom:2}}>{formatINR(calcResults.sip.corpus)}</div>
                    <div style={{fontSize:10,color:"#444c56"}}>Invested: {formatINR(calcResults.sip.invested)}</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                      <div><div style={{fontSize:9,color:"#444c56"}}>GAIN</div><div style={{fontWeight:700,fontSize:12,color:"#93c5fd"}}>{formatINR(calcResults.sip.gain)}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#444c56"}}>XIRR</div><div style={{fontWeight:700,fontSize:12,color:"#bfdbfe"}}>{calcResults.sip.xirr.toFixed(1)}%</div></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="lbl" style={{marginBottom:4}}>Total Corpus vs Total Invested</div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={calcResults.yearData} margin={{top:4,right:16,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="tcg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9373" stopOpacity={0.22}/><stop offset="95%" stopColor="#0d9373" stopOpacity={0}/></linearGradient>
                      <linearGradient id="tig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#656d76" stopOpacity={0.12}/><stop offset="95%" stopColor="#656d76" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                    <XAxis dataKey="yr" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Legend wrapperStyle={{fontSize:11}} formatter={v=>({totalCorpus:"Total Corpus",totalInvested:"Total Invested"}[v]||v)}/>
                    <Area type="monotone" dataKey="totalInvested" name="Total Invested" stroke="#656d76" strokeWidth={1.5} strokeDasharray="5 4" fill="url(#tig)"/>
                    <Area type="monotone" dataKey="totalCorpus" name="Total Corpus" stroke="#0d9373" strokeWidth={2.5} fill="url(#tcg)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="lbl" style={{marginBottom:4}}>Lumpsum vs SIP Breakdown</div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={calcResults.yearData} margin={{top:4,right:16,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                    <XAxis dataKey="yr" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                    <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                    <Line type="monotone" dataKey="lsInvested" name="LS Invested" stroke="#0d9373" strokeWidth={1} strokeDasharray="4 3" dot={false} strokeOpacity={0.45}/>
                    <Line type="monotone" dataKey="lsCorpus" name="LS Corpus" stroke="#0d9373" strokeWidth={2} dot={false} activeDot={{r:4}}/>
                    {sipOn&&<Line type="monotone" dataKey="sipInvested" name="SIP Invested" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 3" dot={false} strokeOpacity={0.45}/>}
                    {sipOn&&<Line type="monotone" dataKey="sipCorpus" name="SIP Corpus" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:4}}/>}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="lbl" style={{marginBottom:12}}>Summary</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{borderBottom:"1px solid #d0d7de"}}>
                    <th style={{textAlign:"left",padding:"6px 12px",color:"#444c56",fontWeight:600,fontSize:10}}>Component</th>
                    {["Invested","Corpus","Gain","Return"].map(h=>(
                      <th key={h} style={{textAlign:"right",padding:"6px 12px",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      {label:"Lumpsum",color:"#0d9373",inv:calcResults.ls.invested,corp:calcResults.ls.corpus,gain:calcResults.ls.gain,ret:rate+"%"},
                      ...(sipOn?[{label:`SIP (${SIP_FREQS[sipFreqKey]?.label}${stepPct>0?` · +${stepPct}% ${STEPUP_FREQS[stepFreq]?.label?.toLowerCase()}`:""})`
                        ,color:"#3b82f6",inv:calcResults.sip.invested,corp:calcResults.sip.corpus,gain:calcResults.sip.gain,ret:calcResults.sip.xirr.toFixed(1)+"%"}]:[]),
                      {label:"TOTAL",color:"#1f2328",inv:calcResults.total.invested,corp:calcResults.total.corpus,gain:calcResults.total.gain,
                        ret:(calcResults.total.invested>0?(calcResults.total.gain/calcResults.total.invested*100):0).toFixed(1)+"%",bold:true},
                    ].map((row,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #0f1f18",background:row.bold?"#ffffff":"transparent"}}>
                        <td style={{padding:"8px 12px",color:row.color,fontWeight:row.bold?700:500,fontSize:row.bold?13:12}}>
                          {!row.bold&&<span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:row.color,marginRight:6,verticalAlign:"middle"}}/>}
                          {row.label}
                        </td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:"#57606a"}}>{formatINR(row.inv)}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:row.color,fontWeight:row.bold?700:500}}>{formatINR(row.corp)}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:"#34d399"}}>{formatINR(row.gain)}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:"#a7f3d0"}}>{row.ret}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>)}
          </>)}

          {/* ═══ FIND SIP results ═══ */}
          {mode==="findsip"&&findSipResults&&(<>

            {/* Hero */}
            <div style={{background:"linear-gradient(135deg,#1a1030,#0d1a14)",border:"1px solid #a78bfa",borderRadius:12,padding:"22px 28px"}}>
              <div style={{fontSize:11,color:"#0d9373",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>
                {fsSipFreqKey.charAt(0).toUpperCase()+fsSipFreqKey.slice(1)} SIP Required
              </div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",color:"#a78bfa"}}>
                {formatINRFull(findSipResults.effectiveSip)}
              </div>
              <div style={{fontSize:12,color:"#444c56",marginTop:6}}>
                to reach <strong style={{color:"#1f2328"}}>{formatINR(targetCorpus)}</strong> in <strong style={{color:"#0d9373"}}>{years} years</strong> at <strong style={{color:"#0d9373"}}>{annualRate}%</strong>
                {fsStepPct>0&&<span style={{color:"#f59e0b"}}> with {fsStepPct}% step-up</span>}
              </div>
            </div>

            {/* Budget breakdown */}
            <div className="card" style={{borderColor:"#a78bfa30"}}>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>How it breaks down</div>
              {[
                {label:"Target Corpus",val:targetCorpus,color:"#a78bfa"},
                {label:`Lumpsum grows to (${formatINR(fsLumpsum)} × ${annualRate}% × ${years}Y)`,val:findSipResults.lsGrowth,color:"#0d9373",sub:true},
                {label:"Gap SIP must cover",val:findSipResults.sipTarget,color:"#3b82f6",bold:true},
              ].map((row,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",borderRadius:7,background:row.bold?"#eff6ff":"#f6f8fa",marginBottom:4}}>
                  <span style={{fontSize:11,color:row.sub?"#656d76":row.color}}>{row.sub?"  ↳ ":""}{row.label}</span>
                  <span style={{fontFamily:"Syne",fontWeight:row.bold?800:600,fontSize:13,color:row.color}}>
                    {row.sub?"−":""}{formatINR(row.val)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
              {[
                [`${findSipResults.freqLabel} SIP`,formatINRFull(findSipResults.effectiveSip),"#a78bfa"],
                ["Lumpsum Contribution",formatINR(findSipResults.lsGrowth),"#0d9373"],
                ["SIP Contribution",formatINR(findSipResults.sipTarget),"#3b82f6"],
                ["Target Corpus",formatINR(targetCorpus),"#1f2328"],
              ].map(([l,v,c])=>(
                <div key={l} className="card" style={{borderColor:"#a78bfa20"}}>
                  <div style={{fontSize:9,color:"#444c56",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(13px,1.3vw,17px)",color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Corpus Journey to Target</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>
                <span style={{color:"#0d9373"}}>━━</span> Lumpsum &nbsp;
                <span style={{color:"#3b82f6"}}>━━</span> SIP &nbsp;
                <span style={{color:"#a78bfa"}}>━━</span> Total &nbsp;
                <span style={{color:"#f59e0b"}}>╌╌</span> Target
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={findSipResults.yearData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="yr" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Line type="monotone" dataKey="lsCorpus" name="Lumpsum" stroke="#0d9373" strokeWidth={1.5} dot={false}/>
                  <Line type="monotone" dataKey="sipCorpus" name="SIP" stroke="#3b82f6" strokeWidth={1.5} dot={false}/>
                  <Line type="monotone" dataKey="totalCorpus" name="Total" stroke="#a78bfa" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                  <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* SIP needed at different step-up levels */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>SIP Required at Different Step-Up Levels</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:12}}>
                Higher step-up = lower starting SIP. Click a row to apply.
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:"1px solid #d0d7de"}}>
                  {["Step-Up","Starting SIP","vs No Step-Up","Saving"].map(h=>(
                    <th key={h} style={{padding:"6px 10px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {findSipResults.variants.map((v,i)=>{
                    const saving=findSipResults.variants[0].sipPerPeriod-v.sipPerPeriod;
                    const isSelected=v.stepPct===fsStepPct;
                    const color=v.stepPct===0?"#9ca3af":v.stepPct<=10?"#0d9373":"#34d399";
                    return(
                      <tr key={i} style={{borderBottom:"1px solid #0f1f18",background:isSelected?"#f3f0ff":"transparent",cursor:"pointer"}}
                        onClick={()=>setFsStepPct(v.stepPct)}>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#a78bfa",fontWeight:isSelected?700:400}}>{v.label}{isSelected?" ←":""}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color,fontFamily:"Syne",fontWeight:600}}>{formatINR(v.sipPerPeriod)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#57606a"}}>{v.stepPct===0?"—":`${((saving/findSipResults.variants[0].sipPerPeriod)*100).toFixed(0)}% lower`}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#34d399"}}>{v.stepPct===0?"—":formatINR(saving)+"/period less"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}
          {mode==="findsip"&&!findSipResults&&(
            <div className="card" style={{textAlign:"center",padding:"40px 20px",color:"#444c56"}}>
              <div style={{fontSize:32,marginBottom:10}}>🎯</div>
              <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>Enter a target corpus to calculate</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function MarketSIPPage(){
  // ── Inputs ─────────────────────────────────────────────────────────────────
  const [lumpsum,setLumpsum]=useState(0);
  const [lumpsumOn,setLumpsumOn]=useState(false);
  const [sipAmount,setSipAmount]=useState(10000);
  const [sipFreq,setSipFreq]=useState("monthly");
  const [stepPct,setStepPct]=useState(0);
  const [stepFreq,setStepFreq]=useState("annually");
  const [startYr,setStartYr]=useState(2010);
  const [endYr,setEndYr]=useState(2024);
  const [fdRate,setFdRate]=useState(7.0);
  const [bondRate,setBondRate]=useState(7.5);
  const [selectedAssets,setSelectedAssets]=useState(["nifty50","banknifty","gold"]);
  const [openGroup,setOpenGroup]=useState("index");
  const startMo=1,endMo=12;
  const toggleAsset=k=>setSelectedAssets(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);

  // ── Shared UI components ────────────────────────────────────────────────────



  // ── Simulation ─────────────────────────────────────────────────────────────
  const allResults=useMemo(()=>{
    const out={};
    const everyN=STEPUP_FREQS[stepFreq]?.everyN||12;
    const ls=lumpsumOn?(Number(lumpsum)||0):0;

    for(const k of selectedAssets){
      const p=ASSET_PROFILES[k];
      const fxRate=k==="fd"?fdRate:bondRate;
      const total=monthsBetween(startYr,startMo,endYr,endMo)+1;
      if(total<2){out[k]=null;continue;}

      let sipCurrentAmt=sipAmount*(SIP_FREQS[sipFreq]?.perMonth||1);
      let sipMsSU=0;
      let sipCorpus=0,sipInvested=0,sipUnits=0;
      let lsCorpus=ls,lsUnits=0;
      const cfs=[];
      const yearData=[];

      // Lumpsum: buy units at start price
      if(ls>0&&!p.isFixed){
        const startKey=`${startYr}-${String(startMo).padStart(2,"0")}`;
        const startPx=ALL_DATA[k]?.[startKey]||1;
        lsUnits=ls/startPx;
      } else if(ls>0&&p.isFixed){
        lsCorpus=ls; // will compound monthly
      }

      for(let i=0;i<total;i++){
        const {yr,mo}=addMonths(startYr,startMo,i);
        const mKey=`${yr}-${String(mo).padStart(2,"0")}`;

        // Step-up
        if(stepPct>0&&i>0){sipMsSU++;if(sipMsSU>=everyN){sipMsSU=0;sipCurrentAmt=sipCurrentAmt*(1+stepPct/100);}}

        // SIP invest
        let count=1;
        if(sipFreq==="daily") count=22;
        else if(sipFreq==="weekly") count=4;
        else if(sipFreq==="quarterly"&&mo%3!==1) count=0;
        else if(sipFreq==="halfyearly"&&mo%6!==1) count=0;
        else if(sipFreq==="annually"&&mo!==1) count=0;

        for(let inv=0;inv<count;inv++){
          if(!p.isFixed){
            const px=ALL_DATA[k]?.[mKey]||0;
            if(px) sipUnits+=sipCurrentAmt/px;
          }
          sipInvested+=sipCurrentAmt;
          cfs.push({date:new Date(startYr,startMo-1+i,1+Math.round((inv/Math.max(count,1))*27)),amount:-sipCurrentAmt});
        }

        // Grow fixed corpus monthly
        if(p.isFixed){
          const mr=Math.pow(1+fxRate/100,1/12)-1;
          if(count>0) sipCorpus=(sipCorpus+sipCurrentAmt)*(1+mr);
          else sipCorpus=sipCorpus*(1+mr);
          if(ls>0) lsCorpus=lsCorpus*(1+mr);
        }

        // Record year-end
        if(mo===12||i===total-1){
          let sipC,lsC;
          if(p.isFixed){
            sipC=sipCorpus;
            lsC=ls>0?lsCorpus:0;
          } else {
            const px=ALL_DATA[k]?.[mKey]||0;
            sipC=sipUnits*px;
            lsC=ls>0?lsUnits*px:0;
          }
          yearData.push({
            year:yr,
            sipCorpus:Math.round(sipC),
            lsCorpus:Math.round(lsC),
            corpus:Math.round(sipC+lsC),
            sipInvested:Math.round(sipInvested),
            lsInvested:ls,
            invested:Math.round(sipInvested+ls),
          });
        }
      }

      // Final values
      const endKey=`${endYr}-${String(endMo).padStart(2,"0")}`;
      let finalSipC,finalLsC;
      if(p.isFixed){
        finalSipC=sipCorpus; finalLsC=ls>0?lsCorpus:0;
      } else {
        const fp=ALL_DATA[k]?.[endKey]||0;
        finalSipC=sipUnits*fp; finalLsC=ls>0?lsUnits*fp:0;
      }
      const finalCorpus=finalSipC+finalLsC;
      const totalInvested=sipInvested+ls;

      // XIRR
      if(ls>0) cfs.unshift({date:new Date(startYr,startMo-1,1),amount:-ls});
      cfs.push({date:new Date(endYr,endMo-1,1),amount:finalCorpus});
      let xirr=0; try{xirr=calcXIRR(cfs)*100;}catch(e){}

      out[k]={
        finalCorpus:Math.round(finalCorpus),
        finalSipC:Math.round(finalSipC),
        finalLsC:Math.round(finalLsC),
        totalInvested:Math.round(totalInvested),
        sipInvested:Math.round(sipInvested),
        absoluteReturn:totalInvested>0?((finalCorpus-totalInvested)/totalInvested)*100:0,
        xirr,
        yearData,
      };
    }
    return out;
  },[selectedAssets,sipAmount,sipFreq,stepPct,stepFreq,lumpsum,lumpsumOn,startYr,endYr,fdRate,bondRate]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  // Chart 1: corpus per asset over time
  const corpusChartData=useMemo(()=>{
    const yrs=new Set();
    Object.values(allResults).forEach(r=>r?.yearData.forEach(d=>yrs.add(d.year)));
    return Array.from(yrs).sort().map(yr=>{
      const row={year:yr};
      selectedAssets.forEach(k=>{
        const yd=allResults[k]?.yearData.find(d=>d.year===yr);
        if(yd){row[`${k}_corpus`]=yd.corpus; row[`${k}_invested`]=yd.invested;}
      });
      return row;
    });
  },[allResults,selectedAssets]);

  const xirrData=useMemo(()=>
    selectedAssets.filter(k=>allResults[k]).map(k=>({
      name:ASSET_PROFILES[k].short,
      xirr:parseFloat((allResults[k].xirr||0).toFixed(2)),
      color:ASSET_PROFILES[k].color
    })).sort((a,b)=>b.xirr-a.xirr)
  ,[allResults,selectedAssets]);


  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>

      {/* ── LEFT PANEL ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* Lumpsum */}
        <div className="card" style={{borderColor:lumpsumOn?"#a78bfa30":"#d0d7de"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:lumpsumOn?14:0}}>
            <div style={{width:8,height:8,borderRadius:2,background:"#a78bfa",flexShrink:0}}/>
            <span style={{fontFamily:"Syne",fontWeight:800,fontSize:13,color:"#a78bfa",flex:1}}>Lumpsum</span>
            <Toggle on={lumpsumOn} set={setLumpsumOn} color="#a78bfa"/>
          </div>
          {lumpsumOn&&(<>
            <div style={{height:1,background:"#d0d7de",marginBottom:14}}/>
            <Field label="One-time Investment" value={lumpsum||""} onChange={v=>setLumpsum(v===""?0:+v)} prefix="₹" step={1000} min={0} color="#a78bfa"
              hint="Invested at start across all selected assets"/>
          </>)}
        </div>

        {/* SIP */}
        <div className="card" style={{borderColor:"#10b98130"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>SIP</div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:7}}>Frequency</div>
            <PillRow options={Object.entries(SIP_FREQS).map(([k,v])=>[k,v.label])} value={sipFreq} set={setSipFreq} activeColor="#0d9373"/>
          </div>

          <Field label={`${SIP_FREQS[sipFreq]?.label||"Monthly"} Amount`} value={sipAmount} onChange={setSipAmount} prefix="₹" step={500} min={0} color="#0d9373"/>

          <div style={{height:1,background:"#d0d7de",margin:"2px 0 14px"}}/>

          {/* Step-up inline */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:stepPct>0?10:0}}>
            <div>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Step-Up %</div>
              <NumInput value={stepPct} onChange={v=>setStepPct(v)} step={1} min={0} max={100} suffix="%" color={stepPct>0?"#f59e0b":"#1f2328"} style={{input:{padding:"9px 12px",fontSize:15}}}/>
              <div style={{fontSize:10,color:"#444c56",marginTop:4}}>0 = no step-up</div>
            </div>
            <div>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Every</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>(
                  <div key={k} onClick={()=>setStepFreq(k)}
                    style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"3px 0",
                      opacity:stepPct>0?1:0.3,pointerEvents:stepPct>0?"auto":"none"}}>
                    <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${stepFreq===k&&stepPct>0?"#f59e0b":"#d0d7de"}`,
                      background:stepFreq===k&&stepPct>0?"#f59e0b":"transparent",flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {stepFreq===k&&stepPct>0&&<div style={{width:4,height:4,borderRadius:"50%",background:"#f6f8fa"}}/>}
                    </div>
                    <span style={{fontSize:11,color:stepFreq===k&&stepPct>0?"#f59e0b":"#6b7280"}}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {stepPct>0&&(
            <div style={{background:"#fffbeb",border:"1px solid #f59e0b30",borderRadius:7,padding:"7px 11px",fontSize:11,color:"#f59e0b",marginTop:4}}>
              ↑ SIP increases by <strong>{stepPct}%</strong> every <strong>{STEPUP_FREQS[stepFreq]?.label?.toLowerCase()}</strong>
            </div>
          )}
        </div>

        {/* Period */}
        <div className="card">
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>Investment Period</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <Field label="Start Year" value={startYr} onChange={v=>setStartYr(Math.min(+v,endYr-1))} step={1} min={2000} color="#0d9373"/>
            <Field label="End Year" value={endYr} onChange={v=>setEndYr(Math.max(+v,startYr+1))} step={1} min={2001} color="#0d9373"/>
          </div>
          <div style={{fontSize:11,color:"#0d9373",background:"#ffffff",borderRadius:6,padding:"5px 10px",marginBottom:10}}>
            Duration: <strong style={{color:"#0d9373"}}>{endYr-startYr} years</strong> &nbsp;·&nbsp; {startYr}–{endYr}
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[{l:"5Y",s:2020,e:2024},{l:"10Y",s:2015,e:2024},{l:"15Y",s:2010,e:2024},{l:"20Y",s:2005,e:2024},{l:"Full",s:2000,e:2024}].map(p=>(
              <div key={p.l} className={`pill ${startYr===p.s&&endYr===p.e?"on":"off"}`} onClick={()=>{setStartYr(p.s);setEndYr(p.e)}}>{p.l}</div>
            ))}
          </div>
        </div>

        {/* Asset selector */}
        <div className="card" style={{padding:"12px 14px"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",marginBottom:10}}>Select Assets</div>
          {Object.entries(GROUPS).map(([gk,g])=>{
            const assets=Object.entries(ASSET_PROFILES).filter(([,v])=>v.group===gk);
            const isOpen=openGroup===gk;
            return(
              <div key={gk} style={{marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",cursor:"pointer",borderRadius:7,userSelect:"none"}}
                  onClick={()=>setOpenGroup(isOpen?null:gk)}>
                  <span style={{fontSize:12,fontWeight:600,color:"#1f2328"}}>{g.icon} {g.label}</span>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:10,color:"#444c56"}}>{assets.filter(([k])=>selectedAssets.includes(k)).length} sel</span>
                    <span style={{color:"#444c56",fontSize:11}}>{isOpen?"▲":"▼"}</span>
                  </div>
                </div>
                {isOpen&&(
                  <div style={{padding:"4px 4px 8px",display:"flex",flexWrap:"wrap",gap:5}}>
                    {assets.map(([k,v])=>{
                      const sel=selectedAssets.includes(k);
                      return(
                        <div key={k} className="asset-pill"
                          style={{background:sel?v.color+"22":"transparent",borderColor:sel?v.color:"#d0d7de",color:sel?v.color:"#6b7280"}}
                          onClick={()=>toggleAsset(k)}>{sel&&"✓ "}{v.label}</div>
                      );
                    })}
                    {gk==="fixed"&&selectedAssets.some(k=>["fd","bond"].includes(k))&&(
                      <div style={{width:"100%",marginTop:8,display:"flex",flexDirection:"column",gap:7}}>
                        {selectedAssets.includes("fd")&&(
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:11,color:"#64748b",whiteSpace:"nowrap",minWidth:50}}>FD %</span>
                            <div style={{display:"flex",alignItems:"center",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:7,overflow:"hidden",flex:1}}>
                              <NumInput value={fdRate} onChange={setFdRate} min={1} max={15} step={0.1} color="#64748b" style={{input:{padding:"6px 10px",fontSize:13}}}/>
                              <span style={{padding:"0 8px",color:"#444c56",fontSize:11}}>%</span>
                            </div>
                          </div>
                        )}
                        {selectedAssets.includes("bond")&&(
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:11,color:"#78716c",whiteSpace:"nowrap",minWidth:50}}>Bond %</span>
                            <div style={{display:"flex",alignItems:"center",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:7,overflow:"hidden",flex:1}}>
                              <NumInput value={bondRate} onChange={setBondRate} min={1} max={15} step={0.1} color="#78716c" style={{input:{padding:"6px 10px",fontSize:13}}}/>
                              <span style={{padding:"0 8px",color:"#444c56",fontSize:11}}>%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Info banner when lumpsum on */}
        {lumpsumOn&&lumpsum>0&&(
          <div style={{padding:"10px 14px",background:"#f3f0ff",border:"1px solid #a78bfa30",borderRadius:10,fontSize:12,color:"#a78bfa",display:"flex",alignItems:"center",gap:8}}>
            <span>💎</span>
            <span><strong>{formatINR(lumpsum)}</strong> lumpsum at start ({startYr}) + <strong>{formatINR(sipAmount)}/{SIP_FREQS[sipFreq]?.label?.toLowerCase()}</strong> SIP{stepPct>0?` with ${stepPct}% step-up`:""}</span>
          </div>
        )}

        {/* Asset result cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:10}}>
          {selectedAssets.map(k=>{
            const r=allResults[k],p=ASSET_PROFILES[k];
            if(!r) return null;
            return(
              <div key={k} className="card" style={{borderColor:p.color+"44",background:`linear-gradient(135deg,${p.color}08,#161b22)`}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:p.color}}/>
                  <span style={{fontSize:11,color:p.color,fontWeight:700}}>{p.label}</span>
                </div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(14px,1.4vw,19px)",color:p.color}}>{formatINR(r.finalCorpus)}</div>
                <div style={{fontSize:10,color:"#444c56",marginTop:2}}>Invested: {formatINR(r.totalInvested)}</div>
                {lumpsumOn&&r.finalLsC>0&&(
                  <div style={{fontSize:10,color:"#a78bfa",marginTop:1}}>LS → {formatINR(r.finalLsC)}</div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
                  <div><div style={{fontSize:9,color:"#444c56"}}>XIRR</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0d9373"}}>{r.xirr.toFixed(1)}%</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#444c56"}}>GAIN</div>
                    <div style={{fontSize:13,fontWeight:700,color:r.absoluteReturn>=0?"#0d9373":"#ef4444"}}>{r.absoluteReturn.toFixed(0)}%</div></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart 1: Corpus vs Invested per asset */}
        {corpusChartData.length>0&&(
          <div className="card">
            <div className="lbl" style={{marginBottom:4}}>Corpus vs Invested — All Assets</div>
            <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>
              {selectedAssets.map(k=>(
                <span key={k} style={{marginRight:12}}>
                  <span style={{color:ASSET_PROFILES[k].color}}>━━</span> {ASSET_PROFILES[k].short} corpus &nbsp;
                  <span style={{color:ASSET_PROFILES[k].color,opacity:0.45}}>╌╌</span> invested
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={corpusChartData} margin={{top:4,right:16,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                <XAxis dataKey="year" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={<ChartTooltip/>}/>
                {selectedAssets.map(k=>[
                  <Line key={`${k}_invested`} type="monotone" dataKey={`${k}_invested`} stroke={ASSET_PROFILES[k].color} strokeWidth={1} strokeDasharray="4 3" dot={false} strokeOpacity={0.4} legendType="none"/>,
                  <Line key={`${k}_corpus`} type="monotone" dataKey={`${k}_corpus`} stroke={ASSET_PROFILES[k].color} strokeWidth={2} dot={false} activeDot={{r:4}} name={ASSET_PROFILES[k].label}/>
                ])}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2: XIRR bar */}
        {xirrData.length>0&&(
          <div className="card">
            <div className="lbl" style={{marginBottom:14}}>XIRR Comparison (%)</div>
            <ResponsiveContainer width="100%" height={Math.max(160,xirrData.length*44)}>
              <BarChart data={xirrData} layout="vertical" margin={{top:0,right:60,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de" horizontal={false}/>
                <XAxis type="number" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                <YAxis type="category" dataKey="name" tick={{fill:"#9ca3af",fontSize:11,fontWeight:600}} axisLine={false} tickLine={false} width={36}/>
                <Tooltip formatter={(v,n,p)=>[`${v}%`,p.payload.name]} contentStyle={{background:"#ffffff",border:"1px solid #d0d7de",borderRadius:8,fontSize:12}}/>
                <Bar dataKey="xirr" radius={[0,5,5,0]} label={{position:"right",fontSize:11,fill:"#9ca3af",formatter:v=>`${v}%`}}>
                  {xirrData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary table */}
        {selectedAssets.some(k=>allResults[k])&&(
          <div className="card">
            <div className="lbl" style={{marginBottom:12}}>Summary</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:480}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #d0d7de"}}>
                    {["Asset","Invested","Final Corpus","Gain","Gain %","XIRR"].map((h,i)=>(
                      <th key={h} style={{textAlign:i===0?"left":"right",padding:"6px 10px",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedAssets.filter(k=>allResults[k]).sort((a,b)=>(allResults[b]?.xirr||0)-(allResults[a]?.xirr||0)).map(k=>{
                    const r=allResults[k],p=ASSET_PROFILES[k];
                    return(
                      <tr key={k} style={{borderBottom:"1px solid #0f1f18"}}>
                        <td style={{padding:"8px 10px",display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                          <span style={{color:p.color,fontWeight:600}}>{p.label}</span>
                        </td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#57606a"}}>{formatINR(r.totalInvested)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:p.color,fontWeight:600}}>{formatINR(r.finalCorpus)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#34d399"}}>{formatINR(r.finalCorpus-r.totalInvested)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:r.absoluteReturn>=0?"#a7f3d0":"#fca5a5"}}>{r.absoluteReturn.toFixed(1)}%</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:r.xirr>=0?"#0d9373":"#ef4444",fontWeight:700}}>{r.xirr.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EMIPage(){
  const [loanType,setLoanType]=useState("home");
  const [principal,setPrincipal]=useState(2000000);
  const [rate,setRate]=useState(8.5);
  const [tenure,setTenure]=useState(20);
  const [prepayOn,setPrepayOn]=useState(false);
  const [prepayAmt,setPrepayAmt]=useState(50000);
  const [prepayFreq,setPrepayFreq]=useState("annually");
  const [prepayStrategy,setPrepayStrategy]=useState("tenure"); // "tenure" or "emi"

  const LOAN_TYPES={
    home:    {label:"🏠 Home",     rateHint:"7–10%",  defaultRate:8.5,  defaultTenure:20, maxTenure:30},
    car:     {label:"🚗 Car",      rateHint:"9–12%",  defaultRate:9.5,  defaultTenure:7,  maxTenure:7},
    personal:{label:"👤 Personal", rateHint:"12–20%", defaultRate:14.0, defaultTenure:5,  maxTenure:7},
    education:{label:"🎓 Education",rateHint:"8–12%", defaultRate:9.0,  defaultTenure:10, maxTenure:15},
  };



  // When loan type changes, update defaults
  const handleLoanType=k=>{
    setLoanType(k);
    setRate(LOAN_TYPES[k].defaultRate);
    setTenure(LOAN_TYPES[k].defaultTenure);
  };

  const results=useMemo(()=>{
    const r=rate/(12*100);
    const n=tenure*12;
    if(r===0||n===0) return null;
    const emi=principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const totalPay=emi*n;
    const totalInt=totalPay-principal;

    // ── Baseline amortization (no prepay) ──────────────────────────────────
    const baseSchedule=[];
    let bBal=principal;
    for(let m=1;m<=n;m++){
      if(bBal<=0) break;
      const intP=bBal*r;
      const prinP=Math.min(emi-intP,bBal);
      bBal-=prinP;
      if(m%12===0||bBal<=0){
        const yr=Math.ceil(m/12);
        const prev=baseSchedule[baseSchedule.length-1];
        const yearInt=m%12===0?emi*12-(prev?principal-bBal-(prev.principalPaid||0):principal-bBal):0;
        baseSchedule.push({
          year:yr,
          balance:Math.round(Math.max(bBal,0)),
          principalPaid:Math.round(principal-Math.max(bBal,0)),
          // per-year principal and interest for stacked bar
          yearPrincipal:Math.round(prev?(principal-Math.max(bBal,0))-(prev.principalPaid||0):principal-Math.max(bBal,0)),
          yearInterest:Math.round(m%12===0?emi*12-(((principal-Math.max(bBal,0))-(prev?prev.principalPaid||0:0))):emi*(m%12||12)-((principal-Math.max(bBal,0))-(prev?prev.principalPaid||0:0))),
        });
      }
    }

    // ── Prepay amortization ────────────────────────────────────────────────
    let pBal=principal,pTotInt=0,pTotPrepay=0,actualMonths=n;
    const prepaySchedule=[];
    let newEmi=emi; // for reduce-EMI strategy, EMI recalculates after each prepay

    for(let m=1;m<=n;m++){
      if(pBal<=0){actualMonths=m-1;break;}
      const intP=pBal*r;
      let prinP;
      if(prepayStrategy==="emi"&&prepayOn){
        // reduce EMI: recalculate EMI after each prepay, keep tenure fixed
        prinP=Math.min(newEmi-intP,pBal);
      } else {
        prinP=Math.min(emi-intP,pBal);
      }
      pBal-=prinP;
      pTotInt+=intP;

      if(prepayOn&&prepayAmt>0){
        let pp=0;
        if(prepayFreq==="monthly") pp=prepayAmt;
        else if(prepayFreq==="quarterly"&&m%3===0) pp=prepayAmt;
        else if(prepayFreq==="annually"&&m%12===0) pp=prepayAmt;
        pp=Math.min(pp,pBal);
        pBal-=pp; pTotPrepay+=pp;
        // if reduce EMI strategy: recalculate EMI for remaining balance + tenure
        if(prepayStrategy==="emi"&&pBal>0){
          const remMonths=n-m;
          if(remMonths>0) newEmi=pBal*r*Math.pow(1+r,remMonths)/(Math.pow(1+r,remMonths)-1);
        }
      }

      if(m%12===0||pBal<=0){
        const yr=Math.ceil(m/12);
        const prev=prepaySchedule[prepaySchedule.length-1];
        prepaySchedule.push({
          year:yr,
          balance:Math.round(Math.max(pBal,0)),
          principalPaid:Math.round(principal-Math.max(pBal,0)),
          yearPrincipal:Math.round(prev?(principal-Math.max(pBal,0))-(prev.principalPaid||0):principal-Math.max(pBal,0)),
          yearInterest:Math.round(intP*12),
        });
        if(pBal<=0){actualMonths=m;break;}
      }
    }

    const actualTotalInt=pTotInt;
    const intSaved=totalInt-actualTotalInt;
    const monthsSaved=n-actualMonths;
    const finalEmi=prepayStrategy==="emi"&&prepayOn?newEmi:emi;

    // ── Comparison chart: balance with vs without prepay ───────────────────
    const maxLen=Math.max(baseSchedule.length,prepaySchedule.length);
    const compChart=Array.from({length:maxLen},(_,i)=>({
      year:(baseSchedule[i]||prepaySchedule[i]).year,
      withoutPrepay:baseSchedule[i]?.balance??0,
      withPrepay:prepaySchedule[i]?.balance??0,
    }));

    return{
      emi,finalEmi,totalPay,totalInt,
      baseSchedule,prepaySchedule,compChart,
      intSaved:prepayOn?intSaved:0,
      monthsSaved:prepayOn?monthsSaved:0,
      pTotPrepay,actualMonths,
    };
  },[principal,rate,tenure,prepayOn,prepayAmt,prepayFreq,prepayStrategy]);


  const schedule=prepayOn?results?.prepaySchedule:results?.baseSchedule;

  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>

      {/* ── LEFT ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* Loan type */}
        <div className="card">
          <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Loan Type</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {Object.entries(LOAN_TYPES).map(([k,v])=>(
              <div key={k} onClick={()=>handleLoanType(k)}
                style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${loanType===k?"#0d9373":"#d0d7de"}`,
                  background:loanType===k?"#f0fdf9":"transparent",cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{fontSize:12,fontWeight:600,color:loanType===k?"#0d9373":"#9ca3af"}}>{v.label}</div>
                <div style={{fontSize:9,color:"#444c56",marginTop:2}}>{v.rateHint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan inputs */}
        <div className="card">
          <Field label="Loan Amount" value={principal} onChange={setPrincipal} prefix="₹" step={50000} min={10000} color="#0d9373"/>
          <Field label="Interest Rate" value={rate} onChange={setRate} suffix="% p.a." step={0.1} min={0.1} color="#0d9373"
            hint={`Typical for ${LOAN_TYPES[loanType].label}: ${LOAN_TYPES[loanType].rateHint}`}/>
          <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color="#0d9373"
            hint={`Max for ${LOAN_TYPES[loanType].label}: ${LOAN_TYPES[loanType].maxTenure}y`}/>
        </div>

        {/* Prepayment */}
        <div className="card" style={{borderColor:prepayOn?"#f59e0b30":"#d0d7de"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:prepayOn?14:0}}>
            <div style={{width:8,height:8,borderRadius:2,background:"#f59e0b",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:13,color:"#f59e0b"}}>Prepayment</div>
              <div style={{fontSize:10,color:"#444c56"}}>Extra payments to close loan faster</div>
            </div>
            <Toggle on={prepayOn} set={setPrepayOn} color="#f59e0b"/>
          </div>

          {prepayOn&&(<>
            <div style={{height:1,background:"#d0d7de",marginBottom:14}}/>

            {/* Strategy */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Strategy</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[
                  {k:"tenure",label:"Reduce Tenure",desc:"Same EMI, pay off sooner"},
                  {k:"emi",   label:"Reduce EMI",   desc:"Lower EMI, same tenure"},
                ].map(({k,label,desc})=>(
                  <div key={k} onClick={()=>setPrepayStrategy(k)}
                    style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${prepayStrategy===k?"#f59e0b":"#d0d7de"}`,
                      background:prepayStrategy===k?"#fffbeb":"transparent",cursor:"pointer"}}>
                    <div style={{fontSize:11,fontWeight:600,color:prepayStrategy===k?"#f59e0b":"#9ca3af"}}>{label}</div>
                    <div style={{fontSize:9,color:"#444c56",marginTop:2}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Prepay Amount" value={prepayAmt} onChange={setPrepayAmt} prefix="₹" step={5000} min={0} color="#f59e0b"/>

            <div style={{marginBottom:0}}>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:7}}>Frequency</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[["monthly","Monthly"],["quarterly","Quarterly"],["annually","Annually"]].map(([k,l])=>(
                  <div key={k} className={`pill ${prepayFreq===k?"on":"off"}`}
                    style={prepayFreq===k?{background:"#f59e0b",borderColor:"#f59e0b",color:"#f6f8fa"}:{}}
                    onClick={()=>setPrepayFreq(k)}>{l}</div>
                ))}
              </div>
            </div>
          </>)}
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {results&&(<>

          {/* Key stats banner */}
          <div style={{background:"linear-gradient(135deg,#0d1a14,#0d1a14)",border:"1px solid #10b98130",borderRadius:12,padding:"16px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:16}}>
            {[
              ["Monthly EMI",formatINRFull(results.emi),"#0d9373",null],
              ["Total Interest",formatINR(results.totalInt),"#f59e0b",((results.totalInt/principal)*100).toFixed(0)+"% of principal"],
              ["Total Payment",formatINR(results.totalPay),"#1f2328",null],
              ...(prepayOn&&results.intSaved>0?[
                ["Interest Saved",formatINR(results.intSaved),"#34d399",`${Math.floor(results.monthsSaved/12)}y ${results.monthsSaved%12}m saved`],
                ...(prepayStrategy==="emi"?[["New EMI",formatINRFull(results.finalEmi),"#a7f3d0","After prepayments"]]:[]),
              ]:[]),
            ].map(([l,v,c,sub])=>(
              <div key={l}>
                <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>{l}</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(14px,1.4vw,19px)",color:c}}>{v}</div>
                {sub&&<div style={{fontSize:9,color:"#444c56",marginTop:2}}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Principal vs Interest split bar */}
          <div className="card">
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Principal vs Interest Split</div>
            <div style={{height:16,borderRadius:8,background:"#d0d7de",overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:`${(principal/results.totalPay*100).toFixed(1)}%`,background:"linear-gradient(90deg,#1a4a30,#10b981)",borderRadius:"8px 0 0 8px"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
              <span style={{color:"#0d9373"}}>● Principal &nbsp;<strong>{(principal/results.totalPay*100).toFixed(0)}%</strong> ({formatINR(principal)})</span>
              <span style={{color:"#f59e0b"}}>● Interest &nbsp;<strong>{(results.totalInt/results.totalPay*100).toFixed(0)}%</strong> ({formatINR(results.totalInt)})</span>
            </div>
          </div>

          {/* Chart 1: With vs Without prepay balance comparison */}
          {prepayOn&&results.compChart.length>0&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Outstanding Balance — With vs Without Prepayment</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>
                <span style={{color:"#3b82f6"}}>━━</span> Without prepayment &nbsp;&nbsp;
                <span style={{color:"#0d9373"}}>━━</span> With prepayment
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={results.compChart} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="wog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="wpg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9373" stopOpacity={0.2}/><stop offset="95%" stopColor="#0d9373" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="year" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Area type="monotone" dataKey="withoutPrepay" name="Without Prepayment" stroke="#3b82f6" strokeWidth={2} fill="url(#wog)"/>
                  <Area type="monotone" dataKey="withPrepay" name="With Prepayment" stroke="#0d9373" strokeWidth={2.5} fill="url(#wpg)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 2: Per-year principal vs interest stacked bar */}
          {schedule&&schedule.length>0&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Annual Principal vs Interest Paid</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>
                <span style={{color:"#0d9373"}}>■</span> Principal &nbsp;&nbsp;
                <span style={{color:"#f59e0b"}}>■</span> Interest
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={schedule} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de" vertical={false}/>
                  <XAxis dataKey="year" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="yearPrincipal" name="Principal" stackId="a" fill="#0d9373" radius={[0,0,0,0]}/>
                  <Bar dataKey="yearInterest" name="Interest" stackId="a" fill="#f59e0b" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 3: Outstanding balance (base or with prepay) */}
          {!prepayOn&&schedule&&schedule.length>0&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:14}}>Outstanding Balance Over Time</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={schedule} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="balg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="year" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" strokeWidth={2} fill="url(#balg)"/>
                  <Area type="monotone" dataKey="principalPaid" name="Principal Paid" stroke="#0d9373" strokeWidth={2} fill="none"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Amortization table */}
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div className="lbl" style={{marginBottom:0}}>Amortization Schedule</div>
              {prepayOn&&<span style={{fontSize:10,color:"#f59e0b",background:"#fffbeb",padding:"3px 8px",borderRadius:4}}>with prepayment</span>}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #d0d7de"}}>
                    {["Year","Balance","Principal Paid","Yr Principal","Yr Interest"].map((h,i)=>(
                      <th key={h} style={{textAlign:"right",padding:"6px 10px",color:"#444c56",fontWeight:600,fontSize:10,
                        ...(i===0?{textAlign:"left"}:{})}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule?.map((r,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #0f1f18"}}>
                      <td style={{padding:"6px 10px",color:"#1f2328",fontWeight:600}}>{r.year}</td>
                      <td style={{padding:"6px 10px",color:"#3b82f6",textAlign:"right"}}>{formatINR(r.balance)}</td>
                      <td style={{padding:"6px 10px",color:"#0d9373",textAlign:"right"}}>{formatINR(r.principalPaid)}</td>
                      <td style={{padding:"6px 10px",color:"#34d399",textAlign:"right"}}>{formatINR(r.yearPrincipal)}</td>
                      <td style={{padding:"6px 10px",color:"#f59e0b",textAlign:"right"}}>{formatINR(r.yearInterest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── RETIREMENT SHARED COMPONENTS (top-level so React never remounts them) ──────
function RetirementSharedInputs({currentAge,setCurrentAge,lifeExp,setLifeExp,
  retireAge,setRetireAge,showRetireAge,
  currentSavings,setCurrentSavings,monthlyExpense,setMonthlyExpense,
  preReturnRate,setPreReturnRate,postReturnRate,setPostReturnRate,
  inflation,setInflation}){
  const timelineFields=[
    {label:"Current Age",value:currentAge,onChange:setCurrentAge,suffix:"y",step:1,min:18},
    ...(showRetireAge?[{label:"Retire At",value:retireAge,onChange:setRetireAge,suffix:"y",step:1,min:currentAge+1}]:[]),
    {label:"Life Expectancy",value:lifeExp,onChange:setLifeExp,suffix:"y",step:1,min:(retireAge||currentAge)+1},
  ];
  return(
    <>
      <div className="card">
        <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Timeline</div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${timelineFields.length},1fr)`,gap:8}}>
          {timelineFields.map(({label,value,onChange,suffix,step,min})=>(
            <div key={label}>
              <div style={{fontSize:9,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,marginBottom:5}}>{label}</div>
              <NumInput value={value} onChange={onChange} step={step} min={min} suffix={suffix} color="#0d9373"/>
            </div>
          ))}
        </div>
        {showRetireAge&&(
          <div style={{marginTop:8,fontSize:11,color:"#444c56",display:"flex",justifyContent:"space-between"}}>
            <span>Accumulation: <strong style={{color:"#0d9373"}}>{(retireAge||0)-currentAge}y</strong></span>
            <span>Retirement: <strong style={{color:"#3b82f6"}}>{lifeExp-(retireAge||0)}y</strong></span>
          </div>
        )}
      </div>
      <div className="card">
        <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Financials</div>
        <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="₹" step={10000} min={0} color="#0d9373"/>
        <Field label="Monthly Expenses (today)" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={1000} min={0} color="#0d9373"/>
        <div style={{background:"#ffffff",border:"1px solid #d0d7de",borderRadius:7,padding:"8px 11px",fontSize:10,color:"#444c56",lineHeight:1.6}}>
          💡 <span style={{color:"#0d9373"}}>If you rent,</span> include rent here — it's a real retirement expense too. If you own property counted as savings, don't double-count it as corpus.
        </div>
      </div>
      <div className="card">
        <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Rates</div>
        <Field label="Pre-retirement Return" value={preReturnRate} onChange={setPreReturnRate} suffix="% p.a." step={0.5} min={1} color="#0d9373" hint="Expected return while accumulating"/>
        <Field label="Post-retirement Return" value={postReturnRate} onChange={setPostReturnRate} suffix="% p.a." step={0.5} min={1} color="#3b82f6" hint="Expected return during retirement"/>
        <Field label="Inflation Rate" value={inflation} onChange={setInflation} suffix="% p.a." step={0.5} min={1} color="#f59e0b"/>
      </div>
    </>
  );
}

function RetirementStepUp({stepPct,setStepPct,stepFreq,setStepFreq}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div>
        <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Step-Up %</div>
        <NumInput value={stepPct} onChange={v=>setStepPct(v)} step={1} min={0} max={50} suffix="%" color={stepPct>0?"#f59e0b":"#1f2328"} style={{input:{padding:"9px 10px",fontSize:15}}}/>
        <div style={{fontSize:10,color:"#444c56",marginTop:4}}>0 = no step-up</div>
      </div>
      <div>
        <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Every</div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>(
            <div key={k} onClick={()=>setStepFreq(k)}
              style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",opacity:stepPct>0?1:0.3,pointerEvents:stepPct>0?"auto":"none"}}>
              <div style={{width:12,height:12,borderRadius:"50%",
                border:`2px solid ${stepFreq===k&&stepPct>0?"#f59e0b":"#d0d7de"}`,
                background:stepFreq===k&&stepPct>0?"#f59e0b":"transparent",
                flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {stepFreq===k&&stepPct>0&&<div style={{width:4,height:4,borderRadius:"50%",background:"#f6f8fa"}}/>}
              </div>
              <span style={{fontSize:11,color:stepFreq===k&&stepPct>0?"#f59e0b":"#6b7280"}}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RETIREMENT PAGE ──────────────────────────────────────────────────────────
function RetirementPage(){
  const [mode,setMode]=useState("check"); // "check" | "sipneeded" | "retigewhen"

  // ── Shared inputs across all modes ─────────────────────────────────────────
  const [currentAge,setCurrentAge]=useState(30);
  const [lifeExp,setLifeExp]=useState(85);
  const [currentSavings,setCurrentSavings]=useState(500000);
  const [monthlyExpense,setMonthlyExpense]=useState(50000);
  const [inflation,setInflation]=useState(6);
  const [preReturnRate,setPreReturnRate]=useState(12);
  const [postReturnRate,setPostReturnRate]=useState(7);

  // ── Mode 1: Plan Check ─────────────────────────────────────────────────────
  const [retireAge,setRetireAge]=useState(60);
  const [monthlySIP,setMonthlySIP]=useState(20000);
  const [sipStepPct,setSipStepPct]=useState(0);
  const [sipStepFreq,setSipStepFreq]=useState("annually");

  // ── Mode 2: SIP Needed ─────────────────────────────────────────────────────
  const [sipRetireAge,setSipRetireAge]=useState(60);
  const [targetCorpus,setTargetCorpus]=useState(0); // 0 = auto-calculate from expenses
  const [sipStep2Pct,setSipStep2Pct]=useState(0);
  const [sipStep2Freq,setSipStep2Freq]=useState("annually");

  // ── Mode 3: Retire When ───────────────────────────────────────────────────
  const [rwMonthlySIP,setRwMonthlySIP]=useState(20000);
  const [rwStepPct,setRwStepPct]=useState(0);
  const [rwStepFreq,setRwStepFreq]=useState("annually");

  // ── Shared corpus-needed calculator ───────────────────────────────────────
  const corpusNeededAt=(retAge)=>{
    const retireYears=lifeExp-retAge;
    if(retireYears<=0) return 0;
    const postR=postReturnRate/100/12;
    const inf=inflation/100/12;
    const yearsToRetire=retAge-currentAge;
    const expAtRetire=monthlyExpense*Math.pow(1+inflation/100,yearsToRetire);
    let needed=0;
    for(let m=1;m<=retireYears*12;m++){
      needed+=expAtRetire*Math.pow(1+inf,m-1)/Math.pow(1+postR,m);
    }
    return needed;
  };

  // ── Mode 1 calc ────────────────────────────────────────────────────────────
  const checkResult=useMemo(()=>{
    const yearsToRetire=retireAge-currentAge;
    const retireYears=lifeExp-retireAge;
    if(yearsToRetire<=0||retireYears<=0) return null;
    const preR=preReturnRate/100/12;
    const postR=postReturnRate/100/12;
    const inf=inflation/100/12;
    const months=yearsToRetire*12;
    const expAtRetire=monthlyExpense*Math.pow(1+inflation/100,yearsToRetire);
    let corpusNeeded=0;
    for(let m=1;m<=retireYears*12;m++) corpusNeeded+=expAtRetire*Math.pow(1+inf,m-1)/Math.pow(1+postR,m);
    const everyN=STEPUP_FREQS[sipStepFreq]?.everyN||12;
    let sipC=0,sipAmt=monthlySIP,msSU=0;
    for(let m=1;m<=months;m++){
      if(sipStepPct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt=sipAmt*(1+sipStepPct/100);}}
      sipC=(sipC+sipAmt)*(1+preR);
    }
    const savingsC=currentSavings*Math.pow(1+preR,months);
    const totalCorpus=sipC+savingsC;
    const surplus=totalCorpus-corpusNeeded;
    // Accum data
    const accumData=[];
    let sipA2=monthlySIP,sipC2=0,msSU2=0;
    for(let m=1;m<=months;m++){
      if(sipStepPct>0&&m>1){msSU2++;if(msSU2>=everyN){msSU2=0;sipA2=sipA2*(1+sipStepPct/100);}}
      sipC2=(sipC2+sipA2)*(1+preR);
      if(m%12===0) accumData.push({age:currentAge+m/12,corpus:Math.round(sipC2+currentSavings*Math.pow(1+preR,m)),savingsCorpus:Math.round(currentSavings*Math.pow(1+preR,m)),target:Math.round(corpusNeeded*(m/months))});
    }
    // Drawdown
    let drawBal=totalCorpus;
    const drawData=[];
    for(let m=1;m<=retireYears*12;m++){
      drawBal=drawBal*(1+postR)-expAtRetire*Math.pow(1+inf,m-1);
      if(m%12===0) drawData.push({age:retireAge+m/12,balance:Math.round(Math.max(drawBal,0)),withdrawal:Math.round(expAtRetire*Math.pow(1+inf,m-1)*12),depleted:drawBal<0});
    }
    const depletionAge=drawData.find(d=>d.depleted)?.age||null;
    // Expense timeline
    const expenseTimeline=[];
    for(let y=1;y<=lifeExp-currentAge;y++) expenseTimeline.push({age:currentAge+y,expense:Math.round(monthlyExpense*Math.pow(1+inflation/100,y))});
    return{expAtRetire,corpusNeeded,totalCorpus,surplus,sipC,savingsC,accumData,drawData,expenseTimeline,
      yearsToRetire,retireYears,corpusSurvives:!depletionAge,depletionAge,
      readinessPct:Math.min((totalCorpus/corpusNeeded)*100,150)};
  },[currentAge,retireAge,lifeExp,currentSavings,monthlyExpense,inflation,preReturnRate,postReturnRate,monthlySIP,sipStepPct,sipStepFreq]);

  // ── Mode 2 calc ────────────────────────────────────────────────────────────
  const sipNeededResult=useMemo(()=>{
    const yearsToRetire=sipRetireAge-currentAge;
    if(yearsToRetire<=0) return null;
    const preR=preReturnRate/100/12;
    const months=yearsToRetire*12;
    const savingsC=currentSavings*Math.pow(1+preR,months);
    // If targetCorpus=0, auto-calculate from expenses
    const autoCorpus=corpusNeededAt(sipRetireAge);
    const corpusTarget=targetCorpus>0?targetCorpus:autoCorpus;
    const sipTarget=Math.max(0,corpusTarget-savingsC);
    // SIP needed without step-up
    const sipNeededFlat=sipTarget>0&&months>0?(sipTarget*preR)/((Math.pow(1+preR,months)-1)*(1+preR)):0;
    // With step-up: use iteration to find starting SIP
    const everyN=STEPUP_FREQS[sipStep2Freq]?.everyN||12;
    let sipNeededWithStep=sipNeededFlat;
    if(sipStep2Pct>0&&sipTarget>0){
      // Binary search for starting SIP
      let lo=0,hi=sipNeededFlat*3;
      for(let iter=0;iter<60;iter++){
        const mid=(lo+hi)/2;
        let c=0,amt=mid,ms=0;
        for(let m=1;m<=months;m++){
          if(m>1){ms++;if(ms>=everyN){ms=0;amt=amt*(1+sipStep2Pct/100);}}
          c=(c+amt)*(1+preR);
        }
        if(c<sipTarget) lo=mid; else hi=mid;
      }
      sipNeededWithStep=(lo+hi)/2;
    }
    const effectiveSIP=sipStep2Pct>0?sipNeededWithStep:sipNeededFlat;
    // Year-by-year with chosen SIP
    const accumData=[];
    let sipAmt=effectiveSIP,sipC=0,msSU=0;
    for(let m=1;m<=months;m++){
      if(sipStep2Pct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt=sipAmt*(1+sipStep2Pct/100);}}
      sipC=(sipC+sipAmt)*(1+preR);
      if(m%12===0) accumData.push({age:currentAge+m/12,corpus:Math.round(sipC+currentSavings*Math.pow(1+preR,m)),target:Math.round(corpusTarget*(m/months))});
    }
    return{sipNeeded:effectiveSIP,sipNeededFlat,corpusTarget,savingsC,autoCorpus,yearsToRetire,accumData};
  },[currentAge,sipRetireAge,lifeExp,currentSavings,monthlyExpense,inflation,preReturnRate,postReturnRate,targetCorpus,sipStep2Pct,sipStep2Freq]);

  // ── Mode 3 calc ────────────────────────────────────────────────────────────
  const retireWhenResult=useMemo(()=>{
    const preR=preReturnRate/100/12;
    const everyN=STEPUP_FREQS[rwStepFreq]?.everyN||12;
    // For each possible retirement age, check if corpus covers expenses
    const timeline=[];
    for(let retAge=currentAge+1;retAge<=80;retAge++){
      const months=(retAge-currentAge)*12;
      let sipC=0,sipAmt=rwMonthlySIP,msSU=0;
      for(let m=1;m<=months;m++){
        if(rwStepPct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt=sipAmt*(1+rwStepPct/100);}}
        sipC=(sipC+sipAmt)*(1+preR);
      }
      const savingsC=currentSavings*Math.pow(1+preR,months);
      const totalCorpus=sipC+savingsC;
      const needed=corpusNeededAt(retAge);
      const pct=needed>0?totalCorpus/needed*100:100;
      timeline.push({age:retAge,corpus:Math.round(totalCorpus),needed:Math.round(needed),pct:Math.round(pct),surplus:Math.round(totalCorpus-needed),canRetire:totalCorpus>=needed});
    }
    const earliest=timeline.find(t=>t.canRetire);
    const comfortable=timeline.find(t=>t.pct>=120);
    return{timeline,earliest,comfortable};
  },[currentAge,lifeExp,currentSavings,monthlyExpense,inflation,preReturnRate,postReturnRate,rwMonthlySIP,rwStepPct,rwStepFreq]);


  // Gauge helpers
  const pct=checkResult?.readinessPct||0;
  const gaugeColor=pct>=100?"#0d9373":pct>=70?"#f59e0b":"#ef4444";
  const R=54,CX=70,CY=70;
  const arcAngle=Math.min(pct/100,1)*180;
  const toRad=d=>d*Math.PI/180;
  const arcX=CX+R*Math.cos(toRad(180-arcAngle));
  const arcY=CY-R*Math.sin(toRad(180-arcAngle));
  const largeArc=arcAngle>180?1:0;



  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Mode switcher */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[
          {k:"check",    icon:"📊",label:"Plan Check",    desc:"How am I tracking?"},
          {k:"sipneeded",icon:"🎯",label:"SIP Needed",    desc:"What SIP do I need?"},
          {k:"retirewhen",icon:"🏁",label:"Retire When",  desc:"When can I retire?"},
        ].map(m=>(
          <div key={m.k} onClick={()=>setMode(m.k)}
            style={{padding:"10px 20px",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s",
              background:mode===m.k?"#0d9373":"#ffffff",color:mode===m.k?"#f6f8fa":"#6b7280",
              border:`1px solid ${mode===m.k?"#0d9373":"#d0d7de"}`}}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:13}}>{m.label}</div>
              <div style={{fontSize:10,opacity:0.7}}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>

        {/* ── LEFT: shared + mode-specific inputs ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <RetirementSharedInputs
            currentAge={currentAge} setCurrentAge={setCurrentAge}
            lifeExp={lifeExp} setLifeExp={setLifeExp}
            retireAge={mode==="check"?retireAge:sipRetireAge}
            setRetireAge={mode==="check"?setRetireAge:setSipRetireAge}
            showRetireAge={mode!=="retirewhen"}
            currentSavings={currentSavings} setCurrentSavings={setCurrentSavings}
            monthlyExpense={monthlyExpense} setMonthlyExpense={setMonthlyExpense}
            preReturnRate={preReturnRate} setPreReturnRate={setPreReturnRate}
            postReturnRate={postReturnRate} setPostReturnRate={setPostReturnRate}
            inflation={inflation} setInflation={setInflation}
          />

          {/* Mode 1 specific */}
          {mode==="check"&&(
            <>

              <div className="card" style={{borderColor:"#10b98130"}}>
                <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Monthly SIP</div>
                <Field label="SIP Amount" value={monthlySIP} onChange={setMonthlySIP} prefix="₹" step={500} min={0} color="#0d9373"/>
                <div style={{height:1,background:"#d0d7de",margin:"2px 0 12px"}}/>
                <RetirementStepUp stepPct={sipStepPct} setStepPct={setSipStepPct} stepFreq={sipStepFreq} setStepFreq={setSipStepFreq}/>
                {sipStepPct>0&&<div style={{marginTop:10,background:"#fffbeb",border:"1px solid #f59e0b30",borderRadius:7,padding:"6px 11px",fontSize:11,color:"#f59e0b"}}>
                  ↑ SIP increases {sipStepPct}% every {STEPUP_FREQS[sipStepFreq]?.label?.toLowerCase()}
                </div>}
              </div>
            </>
          )}

          {/* Mode 2 specific */}
          {mode==="sipneeded"&&(
            <div className="card" style={{borderColor:"#a78bfa30"}}>
              <div style={{fontSize:10,color:"#a78bfa",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Target Corpus</div>
              <Field label="Target Corpus (0 = auto from expenses)" value={targetCorpus} onChange={setTargetCorpus} prefix="₹" step={100000} min={0} color="#a78bfa"
                hint={`0 = auto-calculate: ${sipNeededResult?formatINR(sipNeededResult.autoCorpus):"calculating..."}`}/>
              <div style={{height:1,background:"#d0d7de",margin:"2px 0 12px"}}/>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Step-Up (optional)</div>
              <RetirementStepUp stepPct={sipStep2Pct} setStepPct={setSipStep2Pct} stepFreq={sipStep2Freq} setStepFreq={setSipStep2Freq}/>
              {sipStep2Pct>0&&<div style={{marginTop:10,background:"#fffbeb",border:"1px solid #f59e0b30",borderRadius:7,padding:"6px 11px",fontSize:11,color:"#f59e0b"}}>
                ↑ SIP increases {sipStep2Pct}% every {STEPUP_FREQS[sipStep2Freq]?.label?.toLowerCase()}
              </div>}
            </div>
          )}

          {/* Mode 3 specific */}
          {mode==="retirewhen"&&(
            <div className="card" style={{borderColor:"#ec489930"}}>
              <div style={{fontSize:10,color:"#ec4899",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Monthly SIP</div>
              <Field label="SIP Amount" value={rwMonthlySIP} onChange={setRwMonthlySIP} prefix="₹" step={500} min={0} color="#ec4899"/>
              <div style={{height:1,background:"#d0d7de",margin:"2px 0 12px"}}/>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Step-Up (optional)</div>
              <RetirementStepUp stepPct={rwStepPct} setStepPct={setRwStepPct} stepFreq={rwStepFreq} setStepFreq={setRwStepFreq}/>
              {rwStepPct>0&&<div style={{marginTop:10,background:"#fffbeb",border:"1px solid #f59e0b30",borderRadius:7,padding:"6px 11px",fontSize:11,color:"#f59e0b"}}>
                ↑ SIP increases {rwStepPct}% every {STEPUP_FREQS[rwStepFreq]?.label?.toLowerCase()}
              </div>}
              <div style={{marginTop:12,background:"#eff6ff",border:"1px solid #6b9e8a20",borderRadius:7,padding:"8px 11px",fontSize:10,color:"#444c56",lineHeight:1.7}}>
                💡 We scan every retirement age from {currentAge+1} to 80 and find the earliest age where your corpus covers all retirement expenses through age {lifeExp}.
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: results ── */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* ── MODE 1: PLAN CHECK ── */}
          {mode==="check"&&checkResult&&(<>
            {/* Banner */}
            <div style={{background:"linear-gradient(135deg,#0d1a14,#0d1a14)",border:"1px solid #10b98130",borderRadius:12,padding:"16px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:16}}>
              {[
                ["Corpus Needed",formatINR(checkResult.corpusNeeded),"#f59e0b","At retirement"],
                ["Corpus You'll Build",formatINR(checkResult.totalCorpus),"#0d9373","At retirement"],
                [checkResult.surplus>=0?"Surplus":"Shortfall",formatINR(Math.abs(checkResult.surplus)),checkResult.surplus>=0?"#34d399":"#ef4444",null],
                ["Monthly Exp. at Retirement",formatINR(checkResult.expAtRetire),"#9ca3af","Inflation adjusted"],
              ].map(([l,v,c,sub])=>(
                <div key={l}>
                  <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(14px,1.4vw,18px)",color:c}}>{v}</div>
                  {sub&&<div style={{fontSize:9,color:"#444c56",marginTop:2}}>{sub}</div>}
                </div>
              ))}
            </div>

            {/* Gauge + survivability */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="card" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:8,alignSelf:"flex-start"}}>Retirement Readiness</div>
                <svg width="140" height="80" viewBox="0 0 140 80">
                  <path d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`} fill="none" stroke="#d0d7de" strokeWidth="12" strokeLinecap="round"/>
                  {pct>0&&<path d={`M ${CX-R} ${CY} A ${R} ${R} 0 ${largeArc} 1 ${arcX} ${arcY}`} fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round"/>}
                  <text x={CX} y={CY+4} textAnchor="middle" fill={gaugeColor} fontSize="18" fontFamily="Syne" fontWeight="800">{Math.min(Math.round(pct),150)}%</text>
                  <text x={CX} y={CY+18} textAnchor="middle" fill="#656d76" fontSize="8">of target</text>
                </svg>
                <div style={{fontSize:12,fontWeight:700,color:gaugeColor,marginTop:4}}>{pct>=100?"On Track ✓":pct>=70?"Almost There":"Needs Attention"}</div>
              </div>
              <div className="card" style={{borderColor:checkResult.corpusSurvives?"#10b98130":"#ef444430",background:checkResult.corpusSurvives?"linear-gradient(135deg,#10b98108,#161b22)":"linear-gradient(135deg,#ef444408,#161b22)"}}>
                <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Corpus Survivability</div>
                <div style={{fontSize:28,marginBottom:6}}>{checkResult.corpusSurvives?"💰":"⚠️"}</div>
                {checkResult.corpusSurvives?(
                  <><div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#0d9373"}}>Lasts till age {lifeExp}</div>
                  <div style={{fontSize:11,color:"#444c56",marginTop:4}}>Balance at {lifeExp}: {formatINR(checkResult.drawData[checkResult.drawData.length-1]?.balance||0)}</div></>
                ):(
                  <><div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#ef4444"}}>Depletes at age {checkResult.depletionAge}</div>
                  <div style={{fontSize:11,color:"#f59e0b",marginTop:4}}>{lifeExp-(checkResult.depletionAge||lifeExp)}y before life expectancy</div></>
                )}
              </div>
            </div>

            {/* Accum chart */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Corpus Building Journey</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={checkResult.accumData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9373" stopOpacity={0.25}/><stop offset="95%" stopColor="#0d9373" stopOpacity={0}/></linearGradient>
                    <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="age" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Area type="monotone" dataKey="savingsCorpus" name="Savings Growth" stroke="#3b82f6" strokeWidth={1.5} fill="url(#rg2)"/>
                  <Area type="monotone" dataKey="corpus" name="Total Corpus" stroke="#0d9373" strokeWidth={2.5} fill="url(#rg1)"/>
                  <Line type="monotone" dataKey="target" name="Target Path" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown chart */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Retirement Corpus Drawdown</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>How your corpus depletes as expenses grow with inflation</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={checkResult.drawData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs><linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="age" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Area type="monotone" dataKey="balance" name="Corpus Balance" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ddg)"/>
                  <Line type="monotone" dataKey="withdrawal" name="Annual Withdrawal" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Expense growth */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Monthly Expense Growth Over Lifetime</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>₹{monthlyExpense.toLocaleString("en-IN")}/mo today at {inflation}% inflation</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={checkResult.expenseTimeline} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs><linearGradient id="expg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="age" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="expense" name="Monthly Expense" stroke="#f59e0b" strokeWidth={2} fill="url(#expg)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>)}

          {/* ── MODE 2: SIP NEEDED ── */}
          {mode==="sipneeded"&&sipNeededResult&&(<>
            {/* Hero */}
            <div style={{background:"linear-gradient(135deg,#1a1030,#0d1a14)",border:"1px solid #a78bfa",borderRadius:12,padding:"24px 28px"}}>
              <div style={{fontSize:11,color:"#0d9373",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>
                Monthly SIP Required to Retire at {sipRetireAge}
              </div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",color:"#a78bfa"}}>{formatINRFull(sipNeededResult.sipNeeded)}</div>
              {sipStep2Pct>0&&(
                <div style={{fontSize:12,color:"#444c56",marginTop:4}}>
                  Starting SIP with <strong style={{color:"#f59e0b"}}>{sipStep2Pct}% {STEPUP_FREQS[sipStep2Freq]?.label?.toLowerCase()} step-up</strong>
                  &nbsp;· Without step-up: <strong style={{color:"#c4b5fd"}}>{formatINRFull(sipNeededResult.sipNeededFlat)}</strong>
                </div>
              )}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
              {[
                ["Target Corpus",formatINR(sipNeededResult.corpusTarget),"#a78bfa"],
                ["From Savings",formatINR(sipNeededResult.savingsC),"#c4b5fd"],
                ["SIP Must Build",formatINR(Math.max(0,sipNeededResult.corpusTarget-sipNeededResult.savingsC)),"#e879f9"],
                ["Time to Retire",`${sipNeededResult.yearsToRetire} years`,"#f0abfc"],
              ].map(([l,v,c])=>(
                <div key={l} className="card" style={{borderColor:"#a78bfa20"}}>
                  <div style={{fontSize:9,color:"#444c56",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(13px,1.3vw,17px)",color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* SIP needed at different retire ages */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>SIP Required at Different Retirement Ages</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:12}}>Based on your current savings of {formatINR(currentSavings)} and auto-calculated corpus need. Click to select.</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #d0d7de"}}>
                    {["Retire At","Years Left","Corpus Needed","From Savings","SIP Needed","Comfort"].map(h=>(
                      <th key={h} style={{padding:"6px 8px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[45,50,55,60,65].map(rAge=>{
                    if(rAge<=currentAge) return null;
                    const yrs=rAge-currentAge;
                    const preR=preReturnRate/100/12;
                    const months=yrs*12;
                    const sC=currentSavings*Math.pow(1+preR,months);
                    const needed=corpusNeededAt(rAge);
                    const sipT=Math.max(0,needed-sC);
                    const sip=sipT>0&&months>0?(sipT*preR)/((Math.pow(1+preR,months)-1)*(1+preR)):0;
                    const isSelected=rAge===sipRetireAge;
                    const color=rAge<=50?"#ef4444":rAge<=55?"#f59e0b":"#0d9373";
                    return(
                      <tr key={rAge} style={{borderBottom:"1px solid #0f1f18",background:isSelected?"#f3f0ff":"transparent",cursor:"pointer"}}
                        onClick={()=>setSipRetireAge(rAge)}>
                        <td style={{padding:"8px 8px",textAlign:"right",color:"#a78bfa",fontWeight:isSelected?700:400}}>{rAge}{isSelected?" ←":""}</td>
                        <td style={{padding:"8px 8px",textAlign:"right",color:"#57606a"}}>{yrs}y</td>
                        <td style={{padding:"8px 8px",textAlign:"right",color:"#57606a"}}>{formatINR(needed)}</td>
                        <td style={{padding:"8px 8px",textAlign:"right",color:"#0d9373"}}>{formatINR(sC)}</td>
                        <td style={{padding:"8px 8px",textAlign:"right",color,fontWeight:600,fontFamily:"Syne"}}>{formatINR(sip)}</td>
                        <td style={{padding:"8px 8px",textAlign:"right",color}}>{rAge>=60?"Conservative":rAge>=55?"Moderate":"Aggressive"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Accum chart */}
            <div className="card">
              <div className="lbl" style={{marginBottom:14}}>Corpus Building Journey (with this SIP)</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={sipNeededResult.accumData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs><linearGradient id="sng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="age" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Area type="monotone" dataKey="corpus" name="Projected Corpus" stroke="#a78bfa" strokeWidth={2.5} fill="url(#sng)"/>
                  <Line type="monotone" dataKey="target" name="Target Path" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>)}

          {/* ── MODE 3: RETIRE WHEN ── */}
          {mode==="retirewhen"&&retireWhenResult&&(<>
            {/* Hero */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {label:"Earliest You Can Retire",val:retireWhenResult.earliest,color:"#ec4899",icon:"🏁"},
                {label:"Comfortable Retirement (120% funded)",val:retireWhenResult.comfortable,color:"#0d9373",icon:"😊"},
              ].map(({label,val,color,icon})=>(
                <div key={label} style={{background:"linear-gradient(135deg,#0a1a10,#0d1a14)",border:`1px solid ${color}50`,borderRadius:12,padding:"18px 20px"}}>
                  <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>{label}</div>
                  {val?(
                    <>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:28}}>{icon}</span>
                        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:32,color}}>{val.age}</div>
                      </div>
                      <div style={{fontSize:12,color:"#444c56",marginTop:6}}>
                        In <strong style={{color}}>{val.age-currentAge} years</strong> · Corpus: {formatINR(val.corpus)} · {val.pct}% funded
                      </div>
                    </>
                  ):(
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:"#ef4444",marginTop:8}}>Not achievable by 80 with current SIP</div>
                  )}
                </div>
              ))}
            </div>

            {/* Timeline chart */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Corpus vs Required at Each Retirement Age</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>
                <span style={{color:"#ec4899"}}>━━</span> Your corpus &nbsp;&nbsp;
                <span style={{color:"#f59e0b"}}>━━</span> Corpus needed &nbsp;&nbsp;
                Where corpus crosses needed = earliest retirement age
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={retireWhenResult.timeline} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="age" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Line type="monotone" dataKey="corpus" name="Your Corpus" stroke="#ec4899" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                  <Line type="monotone" dataKey="needed" name="Corpus Needed" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Funding % at each age */}
            <div className="card">
              <div className="lbl" style={{marginBottom:12}}>Retirement Readiness by Age</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:480}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid #d0d7de"}}>
                      {["Age","Years Away","Your Corpus","Corpus Needed","Funded %","Status"].map(h=>(
                        <th key={h} style={{padding:"6px 10px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {retireWhenResult.timeline.filter((_,i)=>i%5===0||retireWhenResult.timeline[i]?.canRetire).map((row,i)=>{
                      const color=row.pct>=120?"#0d9373":row.pct>=100?"#34d399":row.pct>=70?"#f59e0b":"#ef4444";
                      return(
                        <tr key={i} style={{borderBottom:"1px solid #0f1f18",background:row.canRetire&&!retireWhenResult.timeline.slice(0,i).some(r=>r.canRetire)?"#f0fdf9":"transparent"}}>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#1f2328",fontWeight:row.canRetire?700:400}}>{row.age}{row.canRetire&&!retireWhenResult.timeline.slice(0,retireWhenResult.timeline.indexOf(row)).some(r=>r.canRetire)?" 🏁":""}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#57606a"}}>{row.age-currentAge}y</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#ec4899",fontFamily:"Syne",fontWeight:600}}>{formatINR(row.corpus)}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#f59e0b"}}>{formatINR(row.needed)}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color,fontWeight:700}}>{row.pct}%</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color}}>{row.pct>=120?"Comfortable 😊":row.pct>=100?"Ready ✓":row.pct>=70?"Almost":"Not Yet"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ─── AFFORDABILITY PAGE ───────────────────────────────────────────────────────
// ─── FINANCES PANEL (shared left column for both car and house pages) ──────────
function FinancesPanel({income,setIncome,expenses,setExpenses,expenseHint}){
  return(
    <div className="card" style={{borderColor:"#ffffff14"}}>
      <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Your Finances</div>
      <Field label="Monthly Income (In-hand)" value={income} onChange={setIncome} prefix="₹" step={5000} min={0} color="#0d9373"/>
      <div style={{background:"#ffffff",border:"1px solid #10b98120",borderRadius:7,padding:"8px 11px",fontSize:10,color:"#444c56",lineHeight:1.7,marginBottom:14}}>
        💡 <span style={{color:"#0d9373",fontWeight:600}}>True wealth creation is higher:</span> Add Employee PF (12% of basic), Employer PF (12%), NPS, gratuity accrual — these don't hit your account but are real savings.
      </div>
      <Field label="Monthly Expenses (incl. existing EMIs)" value={expenses} onChange={setExpenses} prefix="₹" step={2000} min={0} color="#0d9373"
        hint={expenseHint}/>
    </div>
  );
}

function CarPage(){
  const [income,setIncome]=useState(150000);
  const [expenses,setExpenses]=useState(50000);
  return <CarAffordability income={income} setIncome={setIncome} expenses={expenses} setExpenses={setExpenses}/>;
}

function HousePage(){
  const [income,setIncome]=useState(150000);
  const [expenses,setExpenses]=useState(50000);
  return <HouseAffordability income={income} setIncome={setIncome} expenses={expenses} setExpenses={setExpenses}/>;
}

// ─── CAR AFFORDABILITY ────────────────────────────────────────────────────────
function CarAffordability({income,setIncome,expenses,setExpenses}){
  const [mode,setMode]=useState("check"); // "check" | "discover"
  // Check mode
  const [carPrice,setCarPrice]=useState(1200000);
  const [downPct,setDownPct]=useState(20);
  const [rate,setRate]=useState(9.5);
  const [tenure,setTenure]=useState(5);
  const [insurance,setInsurance]=useState(0); // auto-calculated hint
  const [maintenance,setMaintenance]=useState(6000);
  const [fuel,setFuel]=useState(6000);
  // Discover mode
  const [emiPctOfIncome,setEmiPctOfIncome]=useState(15);
  const [discoverDownPct,setDiscoverDownPct]=useState(20);
  const [discoverRate,setDiscoverRate]=useState(9.5);
  const [discoverTenure,setDiscoverTenure]=useState(5);
  const [discoverRunning,setDiscoverRunning]=useState(8000); // monthly running cost budget

  const insAuto=Math.round(carPrice*0.025/1000)*1000;
  const effectiveIns=insurance>0?insurance:insAuto;

  const check=useMemo(()=>{
    const down=carPrice*downPct/100;
    const loan=carPrice-down;
    const r=rate/12/100;
    const n=tenure*12;
    const emi=r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const monthlyIns=effectiveIns/12;
    const monthlyCost=emi+monthlyIns+maintenance+fuel;
    const emiPct=emi/income*100;
    const totalCostPct=monthlyCost/income*100;
    const disposable=income-expenses-monthlyCost;
    const totalOwnership=down+emi*n+effectiveIns*tenure+maintenance*12*tenure+fuel*12*tenure;
    const comfortable=emiPct<=15;
    const manageable=emiPct<=25;
    const verdict=comfortable?"Comfortable 😊":manageable?"Manageable ⚠️":"Stretched 🔴";
    const verdictColor=comfortable?"#0d9373":manageable?"#f59e0b":"#ef4444";
    const breakdown=[
      {name:"Down Payment",value:Math.round(down),color:"#3b82f6"},
      {name:"Loan Interest",value:Math.round(emi*n-loan),color:"#f59e0b"},
      {name:"Insurance",value:Math.round(effectiveIns*tenure),color:"#ec4899"},
      {name:"Maintenance",value:Math.round(maintenance*12*tenure),color:"#a78bfa"},
      {name:"Fuel",value:Math.round(fuel*12*tenure),color:"#0d9373"},
    ];
    return{down,loan,emi,monthlyCost,emiPct,totalCostPct,disposable,totalOwnership,breakdown,verdict,verdictColor,comfortable,manageable};
  },[carPrice,downPct,rate,tenure,effectiveIns,maintenance,fuel,income,expenses]);

  const discover=useMemo(()=>{
    // Step 1: after other expenses + running costs, what is left for EMI?
    const disposableAfterExpenses=income-expenses;
    const runningBudget=discoverRunning||0;
    const budgetForEmi=Math.max(0,disposableAfterExpenses-runningBudget);
    // Step 2: user's chosen % cap on income is the ceiling — take the lower of the two
    const emiCap=income*emiPctOfIncome/100;
    const maxEmi=Math.min(budgetForEmi,emiCap);
    const r=discoverRate/12/100;
    const n=discoverTenure*12;
    const loanAmt=r===0?maxEmi*n:maxEmi*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
    const maxCarPrice=loanAmt/(1-discoverDownPct/100);
    const down=maxCarPrice*discoverDownPct/100;
    const totalMonthly=maxEmi+runningBudget;
    const limitedByRunning=budgetForEmi<emiCap;
    return{maxEmi,loanAmt:Math.round(loanAmt),maxCarPrice:Math.round(maxCarPrice),
      down:Math.round(down),totalMonthly:Math.round(totalMonthly),
      runningBudget,disposableAfterExpenses,emiCap,limitedByRunning};
  },[income,expenses,emiPctOfIncome,discoverDownPct,discoverRate,discoverTenure,discoverRunning]);

  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>
      {/* Left inputs */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <FinancesPanel income={income} setIncome={setIncome} expenses={expenses} setExpenses={setExpenses}
          expenseHint="Include rent, food, utilities, all existing EMIs — except the car you are calculating here"/>

        {/* Mode switcher */}
        <div className="card" style={{padding:"10px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[{k:"check",label:"Is it affordable?",desc:"Enter car price"},{k:"discover",label:"What can I afford?",desc:"Find your budget"}].map(m=>(
              <div key={m.k} onClick={()=>setMode(m.k)}
                style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",border:`1px solid ${mode===m.k?"#3b82f6":"#d0d7de"}`,
                  background:mode===m.k?"#eff6ff":"transparent",transition:"all 0.15s"}}>
                <div style={{fontSize:11,fontWeight:700,color:mode===m.k?"#3b82f6":"#9ca3af"}}>{m.label}</div>
                <div style={{fontSize:9,color:"#444c56",marginTop:2}}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {mode==="check"&&(
          <div className="card" style={{borderColor:"#3b82f630"}}>
            <div style={{fontSize:10,color:"#3b82f6",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Car Details</div>
            <Field label="Car Price" value={carPrice} onChange={setCarPrice} prefix="₹" step={50000} min={0} color="#3b82f6"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" step={5} min={0} color="#3b82f6"/>
              <Field label="Interest Rate" value={rate} onChange={setRate} suffix="%" step={0.1} min={0} color="#3b82f6"/>
            </div>
            <TipBox>💡 <span style={{color:"#60a5fa"}}>Rates:</span> PSU banks 8.5–10% · Private 9.5–12% · NBFCs 12–16%</TipBox>
            <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color="#3b82f6"/>
            <TipBox>💡 <span style={{color:"#60a5fa"}}>Tenure:</span> 3–7 years typical · 5Y is most popular · Beyond 7Y is rare and costly</TipBox>

            <div style={{height:1,background:"#d0d7de",margin:"4px 0 14px"}}/>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Running Costs</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <Field label="Annual Insurance" value={effectiveIns} onChange={setInsurance} prefix="₹" step={1000} min={0} color="#3b82f6"/>
                <div style={{fontSize:10,color:"#444c56",marginTop:-10,marginBottom:14}}>Auto-est: {formatINR(insAuto)}/yr (2.5% of value)</div>
              </div>
              <Field label="Monthly Maintenance" value={maintenance} onChange={setMaintenance} prefix="₹" step={500} min={0} color="#3b82f6"/>
            </div>
            <TipBox>💡 <span style={{color:"#60a5fa"}}>Insurance:</span> Year 1 ~2–3% of IDV, drops yearly · <span style={{color:"#60a5fa"}}>Maintenance:</span> Petrol ₹3–8K · Diesel ₹4–10K · EV ₹1–3K/mo</TipBox>
            <Field label="Monthly Fuel / Charging" value={fuel} onChange={setFuel} prefix="₹" step={500} min={0} color="#3b82f6"/>
            <TipBox>💡 <span style={{color:"#60a5fa"}}>Fuel:</span> ~₹100/L · 1000–1500 km/mo · 12–18 kmpl → ₹5–12K/mo · EV: ₹2–6K/mo</TipBox>
          </div>
        )}

        {mode==="discover"&&(
          <div className="card" style={{borderColor:"#3b82f630"}}>
            <div style={{fontSize:10,color:"#3b82f6",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Your Comfort Level</div>

            <Field label="Monthly Running Cost Budget" value={discoverRunning} onChange={setDiscoverRunning} prefix="₹" step={500} min={0} color="#3b82f6"
              hint="Insurance/12 + maintenance + fuel — budget you're comfortable spending on car running costs each month"/>
            <TipBox>💡 <span style={{color:"#60a5fa"}}>Typical running costs:</span> Budget car ₹6–10K/mo · Mid-range ₹10–16K/mo · Premium ₹16–25K/mo<br/>
              Includes insurance (~₹1–3K/mo amortised), maintenance, and fuel. Running costs are subtracted first — remaining budget goes to EMI.</TipBox>

            <Field label="Max EMI as % of Income (ceiling)" value={emiPctOfIncome} onChange={setEmiPctOfIncome} suffix="%" step={1} min={1} color="#3b82f6"
              hint="Your EMI will be the lower of: this % cap OR what's left after expenses + running costs"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={discoverDownPct} onChange={setDiscoverDownPct} suffix="%" step={5} min={0} color="#3b82f6"/>
              <Field label="Interest Rate" value={discoverRate} onChange={setDiscoverRate} suffix="%" step={0.1} min={0} color="#3b82f6"/>
            </div>
            <Field label="Tenure" value={discoverTenure} onChange={setDiscoverTenure} suffix="years" step={1} min={1} color="#3b82f6"/>
            <TipBox>💡 Rule of thumb: car price ≤ 6 months gross income · Total car cost ≤ 20% of monthly take-home</TipBox>
          </div>
        )}
      </div>

      {/* Right results */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {mode==="check"&&(
          <>
            {/* Verdict banner */}
            <div style={{background:check.comfortable?"#f0fdf9":check.manageable?"#1a1200":"#fff0f0",
              border:`1px solid ${check.verdictColor}`,borderRadius:12,padding:"16px 20px",
              display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:36}}>{check.comfortable?"🚗":check.manageable?"⚠️":"🔴"}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:check.verdictColor}}>{check.verdict}</div>
                <div style={{fontSize:12,color:"#0d9373",marginTop:3}}>
                  EMI is <strong style={{color:check.verdictColor}}>{check.emiPct.toFixed(1)}%</strong> of income ·
                  Total monthly cost is <strong style={{color:check.verdictColor}}>{check.totalCostPct.toFixed(1)}%</strong> of income
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#444c56",marginBottom:3}}>MONEY LEFT AFTER ALL COSTS</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:check.disposable>0?"#0d9373":"#ef4444"}}>{formatINR(check.disposable)}</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
              {[
                ["Monthly EMI",formatINRFull(check.emi),"#3b82f6"],
                ["All-in Monthly",formatINR(check.monthlyCost),"#60a5fa"],
                ["Down Payment",formatINR(check.down),"#93c5fd"],
                [`Total Cost (${tenure}Y)`,formatINR(check.totalOwnership),"#bfdbfe"],
              ].map(([l,v,c])=>(
                <div key={l} className="card" style={{borderColor:"#3b82f620"}}>
                  <div style={{fontSize:9,color:"#444c56",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(13px,1.3vw,17px)",color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* EMI % gauge */}
            <div className="card">
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>EMI Comfort Gauge</div>
              <div style={{position:"relative",height:10,borderRadius:5,background:"#d0d7de",overflow:"hidden",marginBottom:6}}>
                <div style={{position:"absolute",left:0,height:"100%",width:"15%",background:"#0d9373",opacity:0.3,borderRadius:"5px 0 0 5px"}}/>
                <div style={{position:"absolute",left:"15%",height:"100%",width:"10%",background:"#f59e0b",opacity:0.3}}/>
                <div style={{position:"absolute",left:"25%",height:"100%",right:0,background:"#ef4444",opacity:0.2,borderRadius:"0 5px 5px 0"}}/>
                <div style={{position:"absolute",left:0,height:"100%",width:`${Math.min(check.emiPct,100)}%`,
                  background:check.verdictColor,borderRadius:5,transition:"width 0.4s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#444c56"}}>
                <span style={{color:"#0d9373"}}>0–15% Comfortable</span>
                <span style={{color:"#f59e0b"}}>15–25% Manageable</span>
                <span style={{color:"#ef4444"}}>25%+ Stretched</span>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="card">
              <div className="lbl" style={{marginBottom:14}}>Total Cost of Ownership over {tenure} years</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {check.breakdown.map((d,i)=>(
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                      <span style={{color:d.color}}>● {d.name}</span>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#444c56"}}>{(d.value/check.totalOwnership*100).toFixed(0)}%</span>
                        <span style={{color:"#1f2328",fontWeight:600,fontFamily:"Syne"}}>{formatINR(d.value)}</span>
                      </div>
                    </div>
                    <div style={{height:6,borderRadius:3,background:"#d0d7de",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(d.value/check.totalOwnership*100).toFixed(0)}%`,background:d.color,borderRadius:3}}/>
                    </div>
                  </div>
                ))}
                <div style={{borderTop:"1px solid #d0d7de",paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:"#0d9373",fontSize:12}}>Total</span>
                  <span style={{fontFamily:"Syne",fontWeight:800,color:"#1f2328"}}>{formatINR(check.totalOwnership)}</span>
                </div>
              </div>
            </div>

            {/* Monthly budget */}
            <div className="card">
              <div className="lbl" style={{marginBottom:10}}>Monthly Budget After Car</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                {[
                  ["Income",formatINR(income),"#1f2328"],
                  ["Other Expenses",formatINR(expenses),"#9ca3af"],
                  ["Car EMI",formatINR(check.emi),"#3b82f6"],
                  ["Car Running",formatINR(check.monthlyCost-check.emi),"#60a5fa"],
                  ["Remaining",formatINR(check.disposable),check.disposable>0?"#0d9373":"#ef4444"],
                  ["EMI / Income",check.emiPct.toFixed(1)+"%",check.verdictColor],
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:"#f6f8fa",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:"#444c56",marginBottom:3,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {mode==="discover"&&(
          <>
            {/* Hero result */}
            <div style={{background:"linear-gradient(135deg,#0a1830,#0d1a14)",border:"1px solid #3b82f6",borderRadius:12,padding:"20px 24px"}}>
              <div style={{fontSize:11,color:"#0d9373",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>Max Car Price You Can Afford</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",color:"#3b82f6"}}>{formatINR(discover.maxCarPrice)}</div>
              <div style={{fontSize:12,color:"#444c56",marginTop:6}}>
                Max EMI: <strong style={{color:"#60a5fa"}}>{formatINRFull(discover.maxEmi)}/mo</strong> · {discoverTenure}Y at {discoverRate}%
                {discover.limitedByRunning&&<span style={{color:"#f59e0b",marginLeft:8}}>⚠ Limited by expenses, not the % cap</span>}
              </div>
            </div>

            {/* Budget breakdown — the key insight */}
            <div className="card" style={{borderColor:"#3b82f630"}}>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>How Your Budget Breaks Down</div>
              {[
                {label:"Monthly Income",val:income,color:"#1f2328",bg:"#ffffff"},
                {label:"Other Expenses + existing EMIs",val:-expenses,color:"#57606a",bg:"#f6f8fa"},
                {label:"Running Cost Budget (ins + maint + fuel)",val:-discover.runningBudget,color:"#60a5fa",bg:"#eff6ff"},
                {label:"→ Max EMI ("+emiPctOfIncome+"% cap: "+formatINR(discover.emiCap)+")",val:-discover.maxEmi,color:"#3b82f6",bg:"#eff6ff",bold:true},
                {label:"Remaining after all car costs",val:income-expenses-discover.runningBudget-discover.maxEmi,
                  color:income-expenses-discover.runningBudget-discover.maxEmi>0?"#0d9373":"#ef4444",bg:"#ffffff",bold:true},
              ].map((row,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",borderRadius:7,background:row.bg,marginBottom:4}}>
                  <span style={{fontSize:11,color:row.bold?row.color:"#0d9373"}}>{row.label}</span>
                  <span style={{fontFamily:"Syne",fontWeight:row.bold?800:600,fontSize:13,color:row.color}}>
                    {row.val<0?"−":""}{formatINR(Math.abs(row.val))}
                  </span>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
              {[
                ["Max Car Price",formatINR(discover.maxCarPrice),"#3b82f6"],
                ["Max Loan",formatINR(discover.loanAmt),"#60a5fa"],
                ["Down Payment",formatINR(discover.down),"#93c5fd"],
                ["Total Monthly",formatINR(discover.totalMonthly),"#bfdbfe"],
              ].map(([l,v,c])=>(
                <div key={l} className="card" style={{borderColor:"#3b82f620"}}>
                  <div style={{fontSize:9,color:"#444c56",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(13px,1.3vw,17px)",color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Comparison table at different EMI % levels */}
            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Max Car Price at Different EMI % Caps</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:12}}>Running cost budget of {formatINR(discover.runningBudget)}/mo already deducted. Click a row to select.</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #d0d7de"}}>
                    {["EMI % Cap","Max EMI/mo","Max Loan","Max Car Price","Comfort"].map(h=>(
                      <th key={h} style={{padding:"6px 10px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[10,15,20,25,30].map(pct=>{
                    const emiCap=income*pct/100;
                    const budgetAfter=Math.max(0,income-expenses-discover.runningBudget);
                    const maxE=Math.min(budgetAfter,emiCap);
                    const r=discoverRate/12/100;
                    const n=discoverTenure*12;
                    const loan=r===0?maxE*n:maxE*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
                    const carP=loan/(1-discoverDownPct/100);
                    const color=pct<=15?"#0d9373":pct<=25?"#f59e0b":"#ef4444";
                    const label=pct<=15?"Comfortable":pct<=25?"Manageable":"Stretched";
                    const isSelected=pct===emiPctOfIncome;
                    const capped=budgetAfter<emiCap;
                    return(
                      <tr key={pct} style={{borderBottom:"1px solid #0f1f18",background:isSelected?"#e8f4fd":"transparent",cursor:"pointer"}}
                        onClick={()=>setEmiPctOfIncome(pct)}>
                        <td style={{padding:"8px 10px",color:color,fontWeight:isSelected?700:400}}>{pct}%{isSelected?" ←":""}{capped?" 🔒":""}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:capped?"#f59e0b":"#9ca3af"}}>{formatINR(maxE)}{capped?"*":""}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#57606a"}}>{formatINR(loan)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color,fontWeight:600,fontFamily:"Syne"}}>{formatINR(carP)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color}}>{label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{fontSize:10,color:"#f59e0b",marginTop:8}}>🔒 = EMI limited by cash flow after expenses + running costs, not the % cap. Reduce expenses or running cost budget to unlock higher EMI.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HOUSE AFFORDABILITY ──────────────────────────────────────────────────────
function HouseAffordability({income,setIncome,expenses,setExpenses}){
  const [mode,setMode]=useState("check"); // "check" | "discover" | "rentorbuy"

  // Check mode
  const [housePrice,setHousePrice]=useState(7500000);
  const [downPct,setDownPct]=useState(20);
  const [rate,setRate]=useState(8.5);
  const [tenure,setTenure]=useState(20);
  const [maintenance,setMaintenance]=useState(5000);

  // Discover mode
  const [emiPctOfIncome,setEmiPctOfIncome]=useState(30);
  const [discoverDownPct,setDiscoverDownPct]=useState(20);
  const [discoverRate,setDiscoverRate]=useState(8.5);
  const [discoverTenure,setDiscoverTenure]=useState(20);

  // Rent or Buy
  const [rent,setRent]=useState(25000);
  const [rentIncrease,setRentIncrease]=useState(5);
  const [appreciation,setAppreciation]=useState(7);
  const [investReturn,setInvestReturn]=useState(12);

  const check=useMemo(()=>{
    const down=housePrice*downPct/100;
    const loan=housePrice-down;
    const r=rate/12/100;
    const n=tenure*12;
    const emi=r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const monthlyCost=emi+maintenance;
    const emiPct=emi/income*100;
    const disposable=income-expenses-monthlyCost;
    const finalVal=housePrice*Math.pow(1+appreciation/100,tenure);
    const equityBuilt=finalVal-loan;
    const comfortable=emiPct<=30;
    const manageable=emiPct<=45;
    const verdict=comfortable?"Comfortable 😊":manageable?"Manageable ⚠️":"Stretched 🔴";
    const verdictColor=comfortable?"#0d9373":manageable?"#f59e0b":"#ef4444";
    return{down,loan,emi,monthlyCost,emiPct,disposable,finalVal,equityBuilt,verdict,verdictColor,comfortable,manageable};
  },[housePrice,downPct,rate,tenure,maintenance,income,expenses,appreciation]);

  const discover=useMemo(()=>{
    const maxEmi=income*emiPctOfIncome/100;
    const r=discoverRate/12/100;
    const n=discoverTenure*12;
    const loan=r===0?maxEmi*n:maxEmi*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
    const maxPrice=loan/(1-discoverDownPct/100);
    const down=maxPrice*discoverDownPct/100;
    return{maxEmi,loan:Math.round(loan),maxPrice:Math.round(maxPrice),down:Math.round(down)};
  },[income,emiPctOfIncome,discoverDownPct,discoverRate,discoverTenure]);

  const rentorbuy=useMemo(()=>{
    const down=housePrice*downPct/100;
    const loan=housePrice-down;
    const r=rate/12/100;
    const n=tenure*12;
    const emi=r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    let rentAmt=rent,rentCorpus=down,houseVal=housePrice;
    const data=[];
    for(let y=1;y<=tenure;y++){
      houseVal*=(1+appreciation/100);
      rentAmt*=(1+rentIncrease/100);
      rentCorpus*=(1+investReturn/100);
      if(emi>rent) rentCorpus+=(emi-rent)*12;
      const outstanding=loan*(Math.pow(1+r,y*12)-1)/(Math.pow(1+r,n)-1);
      const equity=Math.max(houseVal-(loan-outstanding),0);
      data.push({year:y,buy:Math.round(equity),rent:Math.round(rentCorpus),
        buyMonthly:Math.round(emi+maintenance),rentMonthly:Math.round(rent*Math.pow(1+rentIncrease/100,y-1))});
    }
    const crossover=data.find((d,i)=>i>0&&data[i-1].buy<=data[i-1].rent&&d.buy>d.rent);
    return{data,crossover,emi,finalRent:rent*Math.pow(1+rentIncrease/100,tenure)};
  },[housePrice,downPct,rate,tenure,maintenance,rent,rentIncrease,appreciation,investReturn]);


  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>
      {/* Left */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <FinancesPanel income={income} setIncome={setIncome} expenses={expenses} setExpenses={setExpenses}
          expenseHint="Include rent, food, utilities, all existing EMIs — except the house you are calculating here"/>

        {/* Mode switcher */}
        <div className="card" style={{padding:"10px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[
              {k:"check",label:"Is it affordable?",desc:"Enter house price"},
              {k:"discover",label:"What can I afford?",desc:"Find your budget"},
              {k:"rentorbuy",label:"Rent or Buy?",desc:"Compare both paths"},
            ].map(m=>(
              <div key={m.k} onClick={()=>setMode(m.k)}
                style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",border:`1px solid ${mode===m.k?"#0d9373":"#d0d7de"}`,
                  background:mode===m.k?"#f0fdf9":"transparent",transition:"all 0.15s",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:mode===m.k?"#0d9373":"#9ca3af"}}>{m.label}</div>
                  <div style={{fontSize:9,color:"#444c56",marginTop:1}}>{m.desc}</div>
                </div>
                {mode===m.k&&<div style={{width:6,height:6,borderRadius:"50%",background:"#0d9373"}}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Shared house fields (check + rentorbuy) */}
        {(mode==="check"||mode==="rentorbuy")&&(
          <div className="card" style={{borderColor:"#10b98130"}}>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Property Details</div>
            <Field label="House Price" value={housePrice} onChange={setHousePrice} prefix="₹" step={500000} min={0} color="#0d9373"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" step={5} min={0} color="#0d9373"/>
              <Field label="Interest Rate" value={rate} onChange={setRate} suffix="%" step={0.1} min={0} color="#0d9373"/>
            </div>
            <TipBox>💡 <span style={{color:"#059669"}}>Home loan rates:</span> PSU banks 8–9.5% · Private banks 8.5–10.5% · Floating rates common · Check for PMAY subsidy if eligible</TipBox>
            <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color="#0d9373"/>
            <TipBox>💡 <span style={{color:"#059669"}}>Tenure:</span> 15–30 years typical · 20Y is most popular · Longer = lower EMI but more interest · SBI/HDFC go up to 30Y</TipBox>
            {mode==="check"&&<Field label="Monthly Maintenance" value={maintenance} onChange={setMaintenance} prefix="₹" step={500} min={0} color="#0d9373"
              hint="Society maintenance: ₹2–10K/mo depending on society and city"/>}
            <TipBox>💡 <span style={{color:"#059669"}}>Down payment:</span> Min 20% (RBI rule) · More down = lower EMI + better rate · Keep 6 months emergency fund before buying</TipBox>
          </div>
        )}

        {/* Discover inputs */}
        {mode==="discover"&&(
          <div className="card" style={{borderColor:"#10b98130"}}>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Comfort Level</div>
            <Field label="Max EMI as % of Income" value={emiPctOfIncome} onChange={setEmiPctOfIncome} suffix="%" step={5} min={5} color="#0d9373"
              hint="RBI guideline: EMI ≤ 40–50% of net income · 30% is conservative · 50% is the max most banks allow"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={discoverDownPct} onChange={setDiscoverDownPct} suffix="%" step={5} min={10} color="#0d9373"/>
              <Field label="Interest Rate" value={discoverRate} onChange={setDiscoverRate} suffix="%" step={0.1} min={0} color="#0d9373"/>
            </div>
            <Field label="Tenure" value={discoverTenure} onChange={setDiscoverTenure} suffix="years" step={1} min={1} color="#0d9373"/>
          </div>
        )}

        {/* Rent or Buy extra inputs */}
        {mode==="rentorbuy"&&(
          <div className="card" style={{borderColor:"#a78bfa30"}}>
            <div style={{fontSize:10,color:"#a78bfa",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Renting Scenario</div>
            <Field label="Current Monthly Rent" value={rent} onChange={setRent} prefix="₹" step={1000} min={0} color="#a78bfa"/>
            <Field label="Annual Rent Increase" value={rentIncrease} onChange={setRentIncrease} suffix="%" step={0.5} min={0} color="#a78bfa"
              hint="Typical 5–10% p.a. · Depends on location and landlord"/>
            <Field label="Property Appreciation" value={appreciation} onChange={setAppreciation} suffix="%" step={0.5} min={0} color="#a78bfa"
              hint="Typical 5–10% p.a. in Indian metros"/>
            <Field label="Investment Return (if renting)" value={investReturn} onChange={setInvestReturn} suffix="%" step={0.5} min={0} color="#a78bfa"
              hint="If down payment + EMI-rent diff invested in mutual funds"/>
            <TipBox>💡 This compares <span style={{color:"#c4b5fd"}}>house equity</span> (buy scenario) vs <span style={{color:"#c4b5fd"}}>investment corpus</span> (rent scenario). The "rent" path assumes down payment + any EMI-rent saving is invested.</TipBox>
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {mode==="check"&&(
          <>
            <div style={{background:check.comfortable?"#f0fdf9":check.manageable?"#1a1200":"#fff0f0",
              border:`1px solid ${check.verdictColor}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:36}}>{check.comfortable?"🏠":check.manageable?"⚠️":"🔴"}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:check.verdictColor}}>{check.verdict}</div>
                <div style={{fontSize:12,color:"#0d9373",marginTop:3}}>
                  EMI is <strong style={{color:check.verdictColor}}>{check.emiPct.toFixed(1)}%</strong> of income ·
                  Total monthly <strong style={{color:check.verdictColor}}>{formatINR(check.monthlyCost)}</strong>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#444c56",marginBottom:3}}>REMAINING AFTER ALL COSTS</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:check.disposable>0?"#0d9373":"#ef4444"}}>{formatINR(check.disposable)}</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
              {[
                ["Monthly EMI",formatINRFull(check.emi),"#0d9373"],
                ["Down Payment",formatINR(check.down),"#059669"],
                [`Value in ${tenure}Y`,formatINR(check.finalVal),"#34d399"],
                ["Equity Built",formatINR(check.equityBuilt),"#a7f3d0"],
              ].map(([l,v,c])=>(
                <div key={l} className="card" style={{borderColor:"#10b98120"}}>
                  <div style={{fontSize:9,color:"#444c56",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(13px,1.3vw,17px)",color:c}}>{v}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>EMI Comfort Gauge</div>
              <div style={{position:"relative",height:10,borderRadius:5,background:"#d0d7de",overflow:"hidden",marginBottom:6}}>
                <div style={{position:"absolute",left:0,height:"100%",width:"30%",background:"#0d9373",opacity:0.25,borderRadius:"5px 0 0 5px"}}/>
                <div style={{position:"absolute",left:"30%",height:"100%",width:"15%",background:"#f59e0b",opacity:0.25}}/>
                <div style={{position:"absolute",left:"45%",height:"100%",right:0,background:"#ef4444",opacity:0.2,borderRadius:"0 5px 5px 0"}}/>
                <div style={{position:"absolute",left:0,height:"100%",width:`${Math.min(check.emiPct,100)}%`,
                  background:check.verdictColor,borderRadius:5,transition:"width 0.4s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#444c56"}}>
                <span style={{color:"#0d9373"}}>0–30% Comfortable</span>
                <span style={{color:"#f59e0b"}}>30–45% Manageable</span>
                <span style={{color:"#ef4444"}}>45%+ Stretched</span>
              </div>
            </div>

            <div className="card">
              <div className="lbl" style={{marginBottom:10}}>Monthly Budget After Home</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                {[
                  ["Income",formatINR(income),"#1f2328"],
                  ["Other Expenses",formatINR(expenses),"#9ca3af"],
                  ["Home EMI",formatINR(check.emi),"#0d9373"],
                  ["Maintenance",formatINR(maintenance),"#059669"],
                  ["Remaining",formatINR(check.disposable),check.disposable>0?"#0d9373":"#ef4444"],
                  ["EMI / Income",check.emiPct.toFixed(1)+"%",check.verdictColor],
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:"#f6f8fa",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:"#444c56",marginBottom:3,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {mode==="discover"&&(
          <>
            <div style={{background:"linear-gradient(135deg,#0d1a14,#0d1a14)",border:"1px solid #10b981",borderRadius:12,padding:"24px 28px"}}>
              <div style={{fontSize:11,color:"#0d9373",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>Max Home Price You Can Afford</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",color:"#0d9373"}}>{formatINR(discover.maxPrice)}</div>
              <div style={{fontSize:13,color:"#444c56",marginTop:6}}>
                at {emiPctOfIncome}% of income → max EMI of <strong style={{color:"#059669"}}>{formatINRFull(discover.maxEmi)}/mo</strong> · {discoverTenure}Y at {discoverRate}%
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
              {[
                ["Max Home Price",formatINR(discover.maxPrice),"#0d9373"],
                ["Max Loan",formatINR(discover.loan),"#059669"],
                ["Down Payment Needed",formatINR(discover.down),"#34d399"],
                ["Max Monthly EMI",formatINRFull(discover.maxEmi),"#a7f3d0"],
              ].map(([l,v,c])=>(
                <div key={l} className="card" style={{borderColor:"#10b98120"}}>
                  <div style={{fontSize:9,color:"#444c56",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(13px,1.3vw,17px)",color:c}}>{v}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="lbl" style={{marginBottom:12}}>Affordability at Different EMI % Levels</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #d0d7de"}}>
                    {["EMI %","Max EMI/mo","Max Loan","Max Home Price","Comfort"].map(h=>(
                      <th key={h} style={{padding:"6px 10px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[20,25,30,35,40,50].map(pct=>{
                    const maxE=income*pct/100;
                    const r=discoverRate/12/100;
                    const n=discoverTenure*12;
                    const loan=r===0?maxE*n:maxE*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
                    const hp=loan/(1-discoverDownPct/100);
                    const color=pct<=30?"#0d9373":pct<=40?"#f59e0b":"#ef4444";
                    const label=pct<=30?"Conservative":pct<=40?"Moderate":"Aggressive";
                    const isSelected=pct===emiPctOfIncome;
                    return(
                      <tr key={pct} style={{borderBottom:"1px solid #0f1f18",background:isSelected?"#f0fdf9":"transparent",cursor:"pointer"}}
                        onClick={()=>setEmiPctOfIncome(pct)}>
                        <td style={{padding:"8px 10px",color,fontWeight:isSelected?700:400}}>{pct}%{isSelected?" ←":""}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#57606a"}}>{formatINR(maxE)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:"#57606a"}}>{formatINR(loan)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color,fontWeight:600,fontFamily:"Syne"}}>{formatINR(hp)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color}}>{label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {mode==="rentorbuy"&&(
          <>
            {/* Crossover callout */}
            <div style={{background:"linear-gradient(135deg,#0d1a14,#1a1030)",border:"1px solid #a78bfa40",borderRadius:12,padding:"16px 20px",display:"flex",gap:20,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>Buy — Monthly Cost</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:"#0d9373"}}>{formatINR(rentorbuy.emi+maintenance)}</div>
                <div style={{fontSize:10,color:"#444c56"}}>EMI + maintenance</div>
              </div>
              <div>
                <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>Rent — Monthly Now</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:"#a78bfa"}}>{formatINR(rent)}</div>
                <div style={{fontSize:10,color:"#444c56"}}>grows to {formatINR(rentorbuy.finalRent)} in {tenure}Y</div>
              </div>
              {rentorbuy.crossover?(
                <div style={{marginLeft:"auto",textAlign:"right"}}>
                  <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>Buy becomes better at</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:"#34d399"}}>Year {rentorbuy.crossover.year}</div>
                  <div style={{fontSize:10,color:"#444c56"}}>House equity overtakes investment corpus</div>
                </div>
              ):(
                <div style={{marginLeft:"auto",textAlign:"right"}}>
                  <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>Verdict in {tenure}Y</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,
                    color:rentorbuy.data[rentorbuy.data.length-1]?.buy>rentorbuy.data[rentorbuy.data.length-1]?.rent?"#0d9373":"#a78bfa"}}>
                    {rentorbuy.data[rentorbuy.data.length-1]?.buy>rentorbuy.data[rentorbuy.data.length-1]?.rent?"Buy wins 🏠":"Rent wins 📈"}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="lbl" style={{marginBottom:4}}>Net Worth Over Time — Buy vs Rent</div>
              <div style={{fontSize:10,color:"#444c56",marginBottom:14}}>
                <span style={{color:"#0d9373"}}>━━</span> Buy (house equity) &nbsp;&nbsp;
                <span style={{color:"#a78bfa"}}>╌╌</span> Rent (down payment + savings invested at {investReturn}%)
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={rentorbuy.data} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                  <XAxis dataKey="year" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Line type="monotone" dataKey="buy" name="Buy (Equity)" stroke="#0d9373" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                  <Line type="monotone" dataKey="rent" name="Rent (Invest)" stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="5 4" dot={false} activeDot={{r:4}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="lbl" style={{marginBottom:12}}>Year-by-Year Comparison</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:480}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid #d0d7de"}}>
                      {["Year","Buy Monthly","Rent Monthly","Buy Equity","Rent Corpus","Better"].map(h=>(
                        <th key={h} style={{padding:"6px 10px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10,":first-child":{textAlign:"left"}}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rentorbuy.data.filter((_,i)=>i%Math.max(1,Math.floor(rentorbuy.data.length/10))===0||i===rentorbuy.data.length-1).map((d,i)=>{
                      const buyWins=d.buy>d.rent;
                      return(
                        <tr key={i} style={{borderBottom:"1px solid #0f1f18"}}>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#1f2328",fontWeight:600}}>{d.year}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#059669"}}>{formatINR(d.buyMonthly)}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#c4b5fd"}}>{formatINR(d.rentMonthly)}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#0d9373",fontFamily:"Syne",fontWeight:600}}>{formatINR(d.buy)}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#a78bfa",fontFamily:"Syne",fontWeight:600}}>{formatINR(d.rent)}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:buyWins?"#0d9373":"#a78bfa",fontWeight:700}}>{buyWins?"Buy 🏠":"Rent 📈"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({setPage}){
  const [heroSip,setHeroSip]=React.useState(10000);
  const [heroYears,setHeroYears]=React.useState(10);
  const [heroRate,setHeroRate]=React.useState(12);

  const heroCorpus=useMemo(()=>{
    const mr=Math.pow(1+heroRate/100,1/12)-1;
    const n=heroYears*12;
    return Math.round(heroSip*(Math.pow(1+mr,n)-1)/mr*(1+mr));
  },[heroSip,heroYears,heroRate]);

  const CALCULATORS=[
    {id:"calculator",icon:"🧮",label:"Lumpsum & SIP",      color:"#0d9373",
     desc:"Calculate corpus growth or find the monthly SIP required to hit a target",
     tags:["Lumpsum","SIP","Step-Up","Find SIP"]},
    {id:"emi",       icon:"🏦",label:"EMI",                 color:"#f59e0b",
     desc:"Home, car, personal & education loans with prepayment strategies",
     tags:["Home Loan","Car Loan","Prepayment","Amortization"]},
    {id:"retirement",icon:"🌅",label:"Retirement",          color:"#a78bfa",
     desc:"Plan check, find required SIP, or discover your earliest retirement age",
     tags:["Plan Check","SIP Needed","Retire When"]},
    {id:"car",       icon:"🚗",label:"Car Affordability",   color:"#60a5fa",
     desc:"Is that car within budget? Or find exactly what car you can afford",
     tags:["Affordability","Running Costs","EMI Gauge"]},
    {id:"house",     icon:"🏠",label:"House Affordability", color:"#059669",
     desc:"Home affordability, max budget calculator and rent vs buy analysis",
     tags:["Affordability","Buy vs Rent","Crossover"]},
    {id:"gratuity",  icon:"🎁",label:"Gratuity",            color:"#fb923c",
     desc:"Gratuity eligibility, tax exemption and retirement projection",
     tags:["Eligibility","Tax Exempt","Projection","Act 1972"]},
    {id:"goalseek",  icon:"🎯",label:"Goal Planner",        color:"#c084fc",
     desc:"Plan up to 5 goals — get monthly SIP needed per goal and combined total",
     tags:["Goals","SIP","Future Value","Timeline"]},
  ];

  const MARKET_INTEL=[];  // hidden for now — coming soon
  const OTHERS=[];          // hidden for now — coming soon

  return(
    <div style={{maxWidth:1400,margin:"0 auto"}}>

      {/* Hero */}
      <div style={{padding:"88px 32px 64px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
          width:1000,height:500,
          background:"radial-gradient(ellipse at 50% 0%,#10b98115 0%,transparent 60%)",
          pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:820,margin:"0 auto"}}>

          {/* Badge */}
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"#10b98115",
            border:"1px solid #10b98135",borderRadius:20,padding:"6px 16px",marginBottom:28}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#0d9373",flexShrink:0}}/>
            <span style={{fontSize:12,color:"#0d9373",fontWeight:600,letterSpacing:"0.3px"}}>Free · No Ads · Built for India</span>
          </div>

          <h1 style={{fontFamily:"Syne,sans-serif",fontWeight:800,
            fontSize:"clamp(44px,7vw,88px)",letterSpacing:"-3px",lineHeight:0.98,marginBottom:22,
            background:"linear-gradient(135deg,#f0f6fc 10%,#c3f8e0 50%,#10b981 90%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Your Money,<br/>Clearly.
          </h1>
          <p style={{fontSize:"clamp(15px,1.8vw,19px)",color:"#424a53",maxWidth:520,
            margin:"0 auto 52px",lineHeight:1.75,fontWeight:400}}>
            Personal finance calculators, market intelligence and India insights —
            built for real decisions.
          </p>

          {/* Live SIP calculator */}
          <div style={{display:"inline-flex",alignItems:"stretch",background:"#ffffff",
            border:"1px solid #30363d",borderRadius:18,overflow:"hidden",flexWrap:"wrap",
            boxShadow:"0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px #10b98118",maxWidth:"100%"}}>
            {[
              {label:"Monthly SIP",  value:heroSip,   set:setHeroSip,   prefix:"₹", step:1000, min:500},
              {label:"Time Horizon", value:heroYears, set:setHeroYears, suffix:" yrs",step:1,  min:1,max:40},
              {label:"Return",       value:heroRate,  set:setHeroRate,  suffix:"% p.a.",step:1,min:1,max:30},
            ].map(({label,value,set,prefix,suffix,step,min,max})=>(
              <div key={label} style={{padding:"20px 28px",borderRight:"1px solid #21262d"}}>
                <div style={{fontSize:10,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:9}}>{label}</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  {prefix&&<span style={{color:"#0d9373",fontFamily:"Syne",fontWeight:800,fontSize:18}}>{prefix}</span>}
                  <NumInput value={value} onChange={set} step={step} min={min||0} max={max} color="#1f2328"
                    style={{input:{padding:"2px 0",fontSize:24,fontFamily:"Syne",fontWeight:800,width:96}}}/>
                  {suffix&&<span style={{color:"#444c56",fontSize:14,marginLeft:2}}>{suffix}</span>}
                </div>
              </div>
            ))}
            <div style={{padding:"20px 32px",
              background:"linear-gradient(135deg,#10b98120,#161b22)",
              display:"flex",flexDirection:"column",justifyContent:"center",minWidth:170}}>
              <div style={{fontSize:10,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:9}}>You'll have</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:30,color:"#0d9373",whiteSpace:"nowrap",lineHeight:1}}>{formatINR(heroCorpus)}</div>
              <div style={{fontSize:12,color:"#444c56",marginTop:5}}>in {heroYears} years</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION RENDERER ── */}
      {[
        {key:"calc",  label:"Calculators",        count:`${CALCULATORS.length} tools`,  items:CALCULATORS,  border:false, calcStyle:true},
        {key:"mkt",   label:"Market Intelligence", count:`${MARKET_INTEL.length} views`, items:MARKET_INTEL, border:true,  calcStyle:false},
        {key:"other", label:"Others",              count:`${OTHERS.length} tools`,       items:OTHERS,       border:true,  calcStyle:false},
      ].filter(s=>s.items.length>0).map(({key,label,count,items,border,calcStyle})=>(
        <div key={key} style={{padding:"16px 32px 60px",borderTop:border?"1px solid #21262d":"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(20px,2.2vw,28px)",color:"#1f2328",letterSpacing:"-0.5px"}}>
              {label}
            </div>
            <div style={{fontSize:12,color:"#444c56",background:"#f0f2f4",border:"1px solid #d0d7de",padding:"3px 12px",borderRadius:10,fontWeight:600}}>
              {count}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:16}}>
            {items.map(t=>(
              <div key={t.id} onClick={()=>setPage(t.id)}
                style={{background:"#ffffff",border:"1px solid #21262d",borderRadius:16,
                  padding:"26px 26px",cursor:"pointer",transition:"all 0.2s",
                  position:"relative",overflow:"hidden"}}
                onMouseEnter={e=>{
                  e.currentTarget.style.borderColor=t.color+"55";
                  e.currentTarget.style.transform="translateY(-4px)";
                  e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.4),0 0 0 1px ${t.color}25`;
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.borderColor="#d0d7de";
                  e.currentTarget.style.transform="translateY(0)";
                  e.currentTarget.style.boxShadow="none";
                }}>
                <div style={{position:"absolute",bottom:-10,right:-6,fontSize:90,
                  opacity:0.04,lineHeight:1,pointerEvents:"none",userSelect:"none"}}>{t.icon}</div>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                  <div style={{width:46,height:46,borderRadius:12,background:t.color+"18",
                    border:`1px solid ${t.color}28`,flexShrink:0,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                    {t.icon}
                  </div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:17,color:"#1f2328"}}>{t.label}</div>
                </div>
                <div style={{fontSize:13,color:"#444c56",lineHeight:1.7,marginBottom:16}}>{t.desc}</div>
                {calcStyle&&t.tags&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                    {t.tags.map(tag=>(
                      <span key={tag} style={{fontSize:11,color:"#444c56",background:"#f6f8fa",
                        border:"1px solid #30363d",borderRadius:6,padding:"3px 9px",fontWeight:500}}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:13,color:t.color,fontWeight:600}}>
                  {calcStyle?"Open calculator":"Explore"} <span style={{fontSize:15}}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Disclaimer */}
      <div style={{padding:"0 24px 32px"}}>
        <div style={{padding:"10px 14px",background:"#f6f8fa",border:"1px solid #1a3020",borderRadius:8,fontSize:11,color:"#444c56",lineHeight:1.7}}>
          <strong style={{color:"#0d9373"}}>Disclaimer:</strong> All calculations are indicative and for educational purposes only.
          Market return data is illustrative — not real-time. Not financial advice.
        </div>
      </div>
    </div>
  );
}

// ─── MARKETS PAGE ─────────────────────────────────────────────────────────────
// ─── SHARED MARKET HELPERS ────────────────────────────────────────────────────
const MARKET_PERIODS=[
  {k:"h6",l:"6M"},{k:"y1",l:"1Y"},{k:"y2",l:"2Y"},{k:"y3",l:"3Y"},
  {k:"y5",l:"5Y"},{k:"y10",l:"10Y"},{k:"y15",l:"15Y"},{k:"y20",l:"20Y"},
];
function getReturnColor(v){
  if(v===undefined||v===null) return "#656d76";
  if(v>=25) return "#0d9373"; if(v>=15) return "#059669"; if(v>=10) return "#34d399";
  if(v>=5)  return "#9ca3af"; if(v>=0)  return "#f59e0b"; return "#ef4444";
}
function ReturnsTable({data,period,setPeriod,nameKey="name",tickerKey,colorKey="color",regionKey,accentColor="#0d9373"}){
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:680}}>
        <thead>
          <tr style={{borderBottom:"1px solid #d0d7de"}}>
            <th style={{textAlign:"left",padding:"9px 14px",color:"#444c56",fontWeight:600,fontSize:10,whiteSpace:"nowrap"}}>Name</th>
            {tickerKey&&<th style={{textAlign:"left",padding:"9px 10px",color:"#444c56",fontWeight:600,fontSize:10}}>Ticker</th>}
            {MARKET_PERIODS.map(p=>(
              <th key={p.k} style={{textAlign:"center",padding:"9px 12px",fontWeight:600,fontSize:10,whiteSpace:"nowrap",
                color:period===p.k?accentColor:"#656d76",
                borderBottom:period===p.k?`2px solid ${accentColor}`:"2px solid transparent"}}>{p.l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row,i)=>(
            <tr key={i} style={{borderBottom:"1px solid #0d1a12",background:i%2===0?"#f6f8fa":"transparent"}}>
              <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>
                {regionKey&&<span style={{marginRight:8,fontSize:14}}>{row[regionKey]}</span>}
                <span style={{color:row[colorKey],fontWeight:600}}>{row[nameKey]}</span>
              </td>
              {tickerKey&&<td style={{padding:"10px 10px",color:"#444c56",fontSize:10}}>{row[tickerKey]}</td>}
              {MARKET_PERIODS.map(p=>{
                const v=row.r?.[p.k];
                const c=getReturnColor(v);
                const sel=period===p.k;
                return(
                  <td key={p.k} style={{padding:"10px 12px",textAlign:"center",background:sel?"#e8f4fd":"transparent"}}>
                    <span style={{color:c,fontWeight:sel?700:400,fontFamily:sel?"Syne":"inherit",fontSize:sel?13:12}}>
                      {v!==undefined?(v>=0?"+":"")+v+"%":"—"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function PeriodSelector({period,setPeriod,accentColor="#0d9373"}){
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {MARKET_PERIODS.map(p=>(
        <div key={p.k} onClick={()=>setPeriod(p.k)}
          style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,
            background:period===p.k?accentColor:"transparent",
            color:period===p.k?"#f6f8fa":"#6b7280",
            border:`1px solid ${period===p.k?accentColor:"#d0d7de"}`,transition:"all 0.15s"}}>
          {p.l}
        </div>
      ))}
    </div>
  );
}
const MARKET_DISCLAIMER=(
  <div style={{background:"#f6f8fa",border:"1px solid #f59e0b30",borderRadius:8,padding:"10px 16px",
    fontSize:11,color:"#f59e0b",display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
    <span>⚠</span>
    <span>Illustrative historical CAGR — not real-time data. Approximate figures for reference and education only.</span>
  </div>
);

// ─── GLOBAL MARKETS PAGE ──────────────────────────────────────────────────────
function GlobalMarketsPage(){
  // Each index has:
  //   r  = local currency CAGR returns (annualised %)
  //   ri = INR returns (local return + INR depreciation vs that currency, annualised %)
  //        USD depreciates INR ~3-4%/yr, GBP ~2-3%/yr, EUR ~2-3%/yr, JPY appreciates vs INR slightly, HKD tracks USD
  //        For indices already in INR (Sensex, Gold INR), ri = r
  const GLOBAL_INDICES=[
    // name, region, currency, color, r (local), ri (INR)
    {name:"S&P 500",        region:"🇺🇸",currency:"USD",color:"#60a5fa",
      r:{h6:9, y1:24,y2:14,y3:12,y5:14,y10:13,y15:14,y20:10},
     ri:{h6:12,y1:28,y2:18,y3:16,y5:18,y10:17,y15:18,y20:14}},
    {name:"Nasdaq 100",     region:"🇺🇸",currency:"USD",color:"#818cf8",
      r:{h6:10,y1:28,y2:12,y3:14,y5:18,y10:17,y15:19,y20:13},
     ri:{h6:13,y1:32,y2:16,y3:18,y5:22,y10:21,y15:23,y20:17}},
    {name:"Dow Jones",      region:"🇺🇸",currency:"USD",color:"#93c5fd",
      r:{h6:7, y1:16,y2:10,y3:9, y5:10,y10:10,y15:10,y20:8},
     ri:{h6:10,y1:20,y2:14,y3:13,y5:14,y10:14,y15:14,y20:12}},
    {name:"FTSE 100",       region:"🇬🇧",currency:"GBP",color:"#f59e0b",
      r:{h6:4, y1:8, y2:5, y3:4, y5:5, y10:5, y15:4, y20:4},
     ri:{h6:6, y1:10,y2:8, y3:7, y5:7, y10:7, y15:6, y20:7}},
    {name:"DAX",            region:"🇩🇪",currency:"EUR",color:"#fbbf24",
      r:{h6:8, y1:18,y2:10,y3:8, y5:9, y10:8, y15:8, y20:7},
     ri:{h6:10,y1:21,y2:13,y3:11,y5:12,y10:11,y15:11,y20:10}},
    {name:"CAC 40",         region:"🇫🇷",currency:"EUR",color:"#fcd34d",
      r:{h6:5, y1:14,y2:8, y3:6, y5:7, y10:7, y15:6, y20:5},
     ri:{h6:7, y1:17,y2:11,y3:9, y5:10,y10:10,y15:9, y20:8}},
    {name:"Nikkei 225",     region:"🇯🇵",currency:"JPY",color:"#fb7185",
      r:{h6:7, y1:19,y2:10,y3:8, y5:10,y10:9, y15:8, y20:6},
     ri:{h6:4, y1:12,y2:4, y3:2, y5:5, y10:5, y15:5, y20:5}},
    {name:"Hang Seng",      region:"🇭🇰",currency:"HKD",color:"#f97316",
      r:{h6:-8,y1:-4,y2:-10,y3:-8,y5:-4,y10:-2,y15:2, y20:3},
     ri:{h6:-5,y1:0, y2:-6,y3:-4,y5:0, y10:2, y15:6, y20:7}},
    {name:"Shanghai Comp.", region:"🇨🇳",currency:"CNY",color:"#ef4444",
      r:{h6:6, y1:10,y2:-4,y3:-2,y5:2, y10:3, y15:4, y20:8},
     ri:{h6:7, y1:11,y2:-3,y3:-1,y5:3, y10:4, y15:5, y20:10}},
    {name:"Sensex",         region:"🇮🇳",currency:"INR",color:"#0d9373",
      r:{h6:8, y1:22,y2:16,y3:14,y5:15,y10:13,y15:14,y20:15},
     ri:{h6:8, y1:22,y2:16,y3:14,y5:15,y10:13,y15:14,y20:15}},
    {name:"Gold (USD)",     region:"🥇",  currency:"USD",color:"#fbbf24",
      r:{h6:8, y1:16,y2:14,y3:14,y5:12,y10:9, y15:10,y20:10},
     ri:{h6:11,y1:20,y2:18,y3:18,y5:16,y10:13,y15:14,y20:14}},
    {name:"Silver (USD)",   region:"🥈",  currency:"USD",color:"#94a3b8",
      r:{h6:6, y1:12,y2:10,y3:10,y5:9, y10:6, y15:7, y20:7},
     ri:{h6:9, y1:16,y2:14,y3:14,y5:13,y10:10,y15:11,y20:11}},
    {name:"Crude Oil (WTI)",region:"🛢",  currency:"USD",color:"#78716c",
      r:{h6:-10,y1:2,y2:8, y3:14,y5:4, y10:2, y15:1, y20:3},
     ri:{h6:-7, y1:6,y2:12,y3:18,y5:8, y10:6, y15:5, y20:7}},
    {name:"Bitcoin (USD)",  region:"₿",   currency:"USD",color:"#f59e0b",
      r:{h6:30,y1:120,y2:40,y3:60,y5:80,y10:150,y15:null,y20:null},
     ri:{h6:34,y1:126,y2:45,y3:65,y5:85,y10:156,y15:null,y20:null}},
  ];

  const [period,setPeriod]=React.useState("y5");
  const [view,setView]=React.useState("local"); // "local" | "inr" | "both"

  // For the table, pass the right data based on view
  const displayData=GLOBAL_INDICES.map(idx=>({
    ...idx,
    r: view==="inr" ? idx.ri : idx.r,
  }));
  const sorted=[...displayData].sort((a,b)=>(b.r[period]??-999)-(a.r[period]??-999));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {MARKET_DISCLAIMER}
      <div style={{background:"#f6f8fa",border:"1px solid #3b82f620",borderRadius:8,padding:"10px 16px",fontSize:11,color:"#444c56",lineHeight:1.6}}>
        💱 <strong style={{color:"#0d9373"}}>Local vs INR returns:</strong> When an Indian invests in a foreign index, returns include both the index performance
        <em> and</em> currency movement. USD has depreciated ~3–4% annually vs INR over 20 years, boosting INR returns.
        JPY has appreciated vs INR, slightly reducing returns. Indices already quoted in INR (Sensex, Gold INR) show identical returns.
      </div>
      <div className="card">
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:"#1f2328",flex:1}}>Global Indices & Commodities</div>
          {/* Currency toggle */}
          <div style={{display:"flex",gap:5,background:"#f6f8fa",padding:"4px",borderRadius:8,border:"1px solid #d0d7de"}}>
            {[
              {k:"local",l:"Local Currency"},
              {k:"inr",  l:"In INR"},
              {k:"both", l:"Both"},
            ].map(v=>(
              <div key={v.k} onClick={()=>setView(v.k)}
                style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,
                  background:view===v.k?"#0d9373":"transparent",
                  color:view===v.k?"#f6f8fa":"#6b7280",transition:"all 0.15s"}}>
                {v.l}
              </div>
            ))}
          </div>
          <PeriodSelector period={period} setPeriod={setPeriod} accentColor="#60a5fa"/>
        </div>

        {/* "Both" mode — two tables side by side */}
        {view==="both"?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[
              {label:"Local Currency",data:GLOBAL_INDICES,accent:"#60a5fa",rKey:"r"},
              {label:"In INR (for Indian investor)",data:GLOBAL_INDICES,accent:"#0d9373",rKey:"ri"},
            ].map(({label,data,accent,rKey})=>(
              <div key={label}>
                <div style={{fontSize:11,fontWeight:600,color:accent,marginBottom:10,
                  display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:2,background:accent}}/>
                  {label}
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #d0d7de"}}>
                        <th style={{textAlign:"left",padding:"7px 10px",color:"#444c56",fontWeight:600,fontSize:9}}>Index</th>
                        {MARKET_PERIODS.map(p=>(
                          <th key={p.k} style={{textAlign:"center",padding:"7px 8px",fontWeight:600,fontSize:9,
                            color:period===p.k?accent:"#656d76",
                            borderBottom:period===p.k?`2px solid ${accent}`:"2px solid transparent"}}>{p.l}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((idx,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid #0d1a12",background:i%2===0?"#f6f8fa":"transparent"}}>
                          <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                            <span style={{marginRight:6}}>{idx.region}</span>
                            <span style={{color:idx.color,fontWeight:600,fontSize:10}}>{idx.name}</span>
                            <span style={{fontSize:8,color:"#444c56",marginLeft:4}}>{idx.currency}</span>
                          </td>
                          {MARKET_PERIODS.map(p=>{
                            const v=idx[rKey]?.[p.k];
                            const c=getReturnColor(v);
                            const sel=period===p.k;
                            return(
                              <td key={p.k} style={{padding:"8px 8px",textAlign:"center",background:sel?accent+"10":"transparent"}}>
                                <span style={{color:c,fontWeight:sel?700:400,fontFamily:sel?"Syne":"inherit",fontSize:sel?12:11}}>
                                  {v!=null?(v>=0?"+":"")+v+"%":"—"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ):(
          /* Single table — local or INR */
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
              <thead>
                <tr style={{borderBottom:"1px solid #d0d7de"}}>
                  <th style={{textAlign:"left",padding:"9px 14px",color:"#444c56",fontWeight:600,fontSize:10,whiteSpace:"nowrap"}}>Index</th>
                  <th style={{padding:"9px 8px",color:"#444c56",fontWeight:600,fontSize:10,textAlign:"center"}}>CCY</th>
                  {MARKET_PERIODS.map(p=>(
                    <th key={p.k} onClick={()=>setPeriod(p.k)} style={{textAlign:"center",padding:"9px 12px",fontWeight:600,fontSize:10,
                      whiteSpace:"nowrap",cursor:"pointer",
                      color:period===p.k?(view==="inr"?"#0d9373":"#60a5fa"):"#656d76",
                      borderBottom:period===p.k?`2px solid ${view==="inr"?"#0d9373":"#60a5fa"}`:"2px solid transparent"}}>{p.l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((idx,i)=>{
                  const origIdx=GLOBAL_INDICES.find(x=>x.name===idx.name);
                  return(
                    <tr key={i} style={{borderBottom:"1px solid #0d1a12",background:i%2===0?"#f6f8fa":"transparent"}}>
                      <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>
                        <span style={{marginRight:8,fontSize:14}}>{idx.region}</span>
                        <span style={{color:idx.color,fontWeight:600}}>{idx.name}</span>
                      </td>
                      <td style={{padding:"10px 8px",textAlign:"center",fontSize:10,color:"#444c56",fontWeight:500}}>
                        {origIdx?.currency||"—"}
                      </td>
                      {MARKET_PERIODS.map(p=>{
                        const v=idx.r?.[p.k];
                        const vOther=view==="inr"?origIdx?.r?.[p.k]:origIdx?.ri?.[p.k]; // the other view
                        const c=getReturnColor(v);
                        const sel=period===p.k;
                        return(
                          <td key={p.k} style={{padding:"10px 12px",textAlign:"center",
                            background:sel?(view==="inr"?"#e8f4fd":"#eff6ff"):"transparent"}}>
                            <div style={{color:c,fontWeight:sel?700:400,fontFamily:sel?"Syne":"inherit",fontSize:sel?13:12}}>
                              {v!=null?(v>=0?"+":"")+v+"%":"—"}
                            </div>
                            {sel&&vOther!=null&&origIdx?.currency!=="INR"&&(
                              <div style={{fontSize:9,color:"#444c56",marginTop:1}}>
                                {view==="inr"?"local:":"INR:"} {vOther>=0?"+":""}{vOther}%
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{marginTop:12,display:"flex",gap:16,flexWrap:"wrap",fontSize:10,color:"#444c56"}}>
          <span>CCY = local currency of the index</span>
          <span>·</span>
          <span style={{color:view==="inr"?"#0d9373":"#60a5fa"}}>
            {view==="local"?"Showing local currency returns — as the index trades"
             :view==="inr"?"Showing INR returns — what an Indian investor earns after currency impact"
             :"Left: local currency · Right: INR returns for Indian investor"}
          </span>
          {view!=="both"&&<span>· Selected period column also shows the other view below each number</span>}
        </div>
      </div>
    </div>
  );
}

// ─── INDIA MARKETS PAGE ───────────────────────────────────────────────────────
function IndiaMarketsPage(){
  const INDIA_INDICES=[
    {name:"Nifty 50",       region:"📈",color:"#0d9373",r:{h6:8, y1:22,y2:16,y3:14,y5:15,y10:13,y15:14,y20:15}},
    {name:"Nifty Midcap 150",region:"📈",color:"#059669",r:{h6:12,y1:28,y2:19,y3:17,y5:18,y10:16,y15:17,y20:16}},
    {name:"Nifty Smallcap 250",region:"📈",color:"#34d399",r:{h6:15,y1:32,y2:18,y3:15,y5:17,y10:14,y15:15,y20:14}},
    {name:"Nifty IT",       region:"💻",color:"#a78bfa",r:{h6:5, y1:18,y2:24,y3:20,y5:22,y10:19,y15:21,y20:20}},
    {name:"Bank Nifty",     region:"🏦",color:"#3b82f6",r:{h6:6, y1:16,y2:12,y3:11,y5:13,y10:12,y15:13,y20:14}},
    {name:"Nifty Pharma",   region:"💊",color:"#fb923c",r:{h6:10,y1:24,y2:20,y3:18,y5:16,y10:14,y15:15,y20:13}},
    {name:"Nifty Auto",     region:"🚗",color:"#fbbf24",r:{h6:8, y1:26,y2:24,y3:20,y5:18,y10:13,y15:12,y20:10}},
    {name:"Nifty FMCG",     region:"🛒",color:"#f472b6",r:{h6:-2,y1:4, y2:6, y3:10,y5:11,y10:13,y15:14,y20:14}},
    {name:"Nifty Realty",   region:"🏢",color:"#f97316",r:{h6:14,y1:40,y2:36,y3:30,y5:22,y10:10,y15:8, y20:6}},
    {name:"Nifty Metal",    region:"⚙️",color:"#94a3b8",r:{h6:6, y1:30,y2:28,y3:22,y5:18,y10:8, y15:7, y20:6}},
    {name:"Nifty PSU Bank", region:"🏦",color:"#7dd3fc",r:{h6:10,y1:32,y2:38,y3:34,y5:28,y10:6, y15:4, y20:3}},
    {name:"Gold (INR)",     region:"🥇",color:"#fbbf24",r:{h6:6, y1:14,y2:12,y3:13,y5:11,y10:10,y15:11,y20:13}},
    {name:"Silver (INR)",   region:"🥈",color:"#94a3b8",r:{h6:4, y1:10,y2:8, y3:9, y5:8, y10:7, y15:8, y20:9}},
  ];

  const STOCKS=[
    {name:"Reliance",       ticker:"RELIANCE",  color:"#f97316",r:{h6:5, y1:18,y2:22,y3:20,y5:24,y10:18,y15:22,y20:20}},
    {name:"TCS",            ticker:"TCS",       color:"#22d3ee",r:{h6:8, y1:14,y2:18,y3:17,y5:19,y10:21,y15:24,y20:22}},
    {name:"HDFC Bank",      ticker:"HDFCBANK",  color:"#4ade80",r:{h6:-2,y1:6, y2:4, y3:8, y5:14,y10:19,y15:22,y20:21}},
    {name:"Infosys",        ticker:"INFY",      color:"#c084fc",r:{h6:6, y1:16,y2:20,y3:18,y5:20,y10:19,y15:22,y20:21}},
    {name:"ICICI Bank",     ticker:"ICICIBANK", color:"#f472b6",r:{h6:10,y1:22,y2:28,y3:26,y5:28,y10:22,y15:20,y20:18}},
    {name:"Bajaj Finance",  ticker:"BAJFINANCE",color:"#fb7185",r:{h6:4, y1:12,y2:8, y3:24,y5:38,y10:42,y15:44,y20:40}},
    {name:"Titan",          ticker:"TITAN",     color:"#f0abfc",r:{h6:8, y1:24,y2:28,y3:26,y5:30,y10:32,y15:36,y20:34}},
    {name:"Asian Paints",   ticker:"ASIANPAINT",color:"#fde047",r:{h6:-4,y1:-2,y2:2, y3:8, y5:14,y10:18,y15:24,y20:22}},
    {name:"Kotak Bank",     ticker:"KOTAKBANK", color:"#93c5fd",r:{h6:2, y1:8, y2:6, y3:10,y5:14,y10:18,y15:20,y20:19}},
    {name:"SBI",            ticker:"SBIN",      color:"#7dd3fc",r:{h6:12,y1:28,y2:32,y3:28,y5:26,y10:14,y15:12,y20:10}},
    {name:"Maruti",         ticker:"MARUTI",    color:"#fca5a5",r:{h6:6, y1:18,y2:14,y3:16,y5:18,y10:20,y15:18,y20:16}},
    {name:"L&T",            ticker:"LT",        color:"#34d399",r:{h6:14,y1:32,y2:28,y3:24,y5:22,y10:16,y15:14,y20:13}},
    {name:"HUL",            ticker:"HINDUNILVR",color:"#059669",r:{h6:-6,y1:-2,y2:4, y3:8, y5:12,y10:16,y15:18,y20:18}},
    {name:"Wipro",          ticker:"WIPRO",     color:"#a5f3fc",r:{h6:4, y1:12,y2:16,y3:14,y5:16,y10:14,y15:16,y20:15}},
    {name:"Axis Bank",      ticker:"AXISBANK",  color:"#86efac",r:{h6:8, y1:20,y2:24,y3:20,y5:18,y10:14,y15:12,y20:10}},
    {name:"ITC",            ticker:"ITC",       color:"#fde68a",r:{h6:2, y1:12,y2:20,y3:18,y5:12,y10:10,y15:12,y20:14}},
    {name:"Adani Ports",    ticker:"ADANIPORTS",color:"#67e8f9",r:{h6:10,y1:28,y2:24,y3:30,y5:26,y10:22,y15:null,y20:null}},
    {name:"Sun Pharma",     ticker:"SUNPHARMA", color:"#fda4af",r:{h6:12,y1:30,y2:26,y3:22,y5:18,y10:16,y15:18,y20:16}},
    {name:"Tata Motors",    ticker:"TATAMOTORS",color:"#fb923c",r:{h6:8, y1:22,y2:40,y3:36,y5:28,y10:6, y15:8, y20:6}},
    {name:"Bajaj Auto",     ticker:"BAJAJ-AUTO",color:"#fcd34d",r:{h6:6, y1:24,y2:22,y3:20,y5:18,y10:16,y15:14,y20:12}},
  ];

  const [idxPeriod,setIdxPeriod]=React.useState("y5");
  const [stkPeriod,setStkPeriod]=React.useState("y5");
  const [stkSort,setStkSort]=React.useState("period");
  const sorted=[...STOCKS].sort((a,b)=>
    stkSort==="period"?(b.r[stkPeriod]??-999)-(a.r[stkPeriod]??-999):a.name.localeCompare(b.name));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      {MARKET_DISCLAIMER}

      {/* Indian Indices */}
      <div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:"#1f2328"}}>Indian Indices</div>
          <PeriodSelector period={idxPeriod} setPeriod={setIdxPeriod} accentColor="#0d9373"/>
        </div>
        <div className="card">
          <ReturnsTable data={INDIA_INDICES} period={idxPeriod} setPeriod={setIdxPeriod} regionKey="region" accentColor="#0d9373"/>
        </div>
      </div>

      {/* Indian Stocks */}
      <div>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:"#1f2328"}}>Top Indian Stocks (Nifty 50)</div>
          <PeriodSelector period={stkPeriod} setPeriod={setStkPeriod} accentColor="#3b82f6"/>
          <div style={{marginLeft:"auto",display:"flex",gap:5}}>
            {[{k:"period",l:"By Return"},{k:"name",l:"By Name"}].map(s=>(
              <div key={s.k} onClick={()=>setStkSort(s.k)}
                style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,
                  background:stkSort===s.k?"#d0d7de":"transparent",color:stkSort===s.k?"#0d9373":"#656d76",
                  border:"1px solid #d0d7de"}}>
                {s.l}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <ReturnsTable data={sorted} period={stkPeriod} setPeriod={setStkPeriod} tickerKey="ticker" accentColor="#3b82f6"/>
        </div>
      </div>
    </div>
  );
}

// ─── PERCENTILE BAR (top-level to avoid remount bug) ─────────────────────────
function PercentileBar({pct,color,label}){
  const bars=Array.from({length:20},(_,i)=>i*5);
  return(
    <div style={{marginTop:12}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#444c56",marginBottom:5}}>
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
      <div style={{display:"flex",gap:2}}>
        {bars.map(b=>(
          <div key={b} style={{flex:1,height:20,borderRadius:3,
            background:pct>=b?color:"#d0d7de",opacity:pct>=b?0.4+((b/100)*0.6):1,transition:"all 0.3s"}}/>
        ))}
      </div>
      <div style={{fontSize:11,color,fontFamily:"Syne",fontWeight:700,marginTop:6}}>{label}</div>
    </div>
  );
}

// ─── SOURCE BADGE ─────────────────────────────────────────────────────────────
function SourceBadge({text}){
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f6f8fa",
      border:"1px solid #d0d7de",borderRadius:4,padding:"2px 8px",fontSize:9,color:"#444c56"}}>
      📎 {text}
    </div>
  );
}

// ─── WHERE DO I STAND PAGE ────────────────────────────────────────────────────
function PercentilePage(){

  // ── Income: India — ITR + CMIE household income survey 2023 ──────────────
  const INDIA_INCOME=[
    {pct:10,monthly:4000},{pct:20,monthly:7000},{pct:30,monthly:10000},
    {pct:40,monthly:14000},{pct:50,monthly:19000},{pct:60,monthly:26000},
    {pct:70,monthly:36000},{pct:75,monthly:44000},{pct:80,monthly:55000},
    {pct:85,monthly:72000},{pct:90,monthly:100000},{pct:95,monthly:160000},
    {pct:99,monthly:400000},{pct:99.9,monthly:1500000},
  ];

  // ── Income: World — World Bank PIP 2023, PPP-adjusted, converted ~₹83/USD ─
  const WORLD_INCOME=[
    {pct:10,monthly:2000},{pct:20,monthly:4000},{pct:30,monthly:6500},
    {pct:40,monthly:10000},{pct:50,monthly:16000},{pct:60,monthly:25000},
    {pct:70,monthly:40000},{pct:80,monthly:66000},{pct:90,monthly:125000},
    {pct:95,monthly:250000},{pct:99,monthly:830000},
  ];

  // ── Net Worth: India by age — Credit Suisse Global Wealth Report 2023 ─────
  // All figures in INR. Age-group medians and percentile cutoffs estimated from report.
  const INDIA_NW_BY_AGE={
    "20-29":[{pct:25,nw:5000},{pct:50,nw:20000},{pct:70,nw:80000},{pct:80,nw:200000},{pct:90,nw:600000},{pct:95,nw:1500000},{pct:99,nw:8000000}],
    "30-39":[{pct:25,nw:30000},{pct:50,nw:150000},{pct:70,nw:500000},{pct:80,nw:1200000},{pct:90,nw:3000000},{pct:95,nw:7000000},{pct:99,nw:25000000}],
    "40-49":[{pct:25,nw:80000},{pct:50,nw:400000},{pct:70,nw:1200000},{pct:80,nw:2500000},{pct:90,nw:6000000},{pct:95,nw:12000000},{pct:99,nw:40000000}],
    "50-59":[{pct:25,nw:150000},{pct:50,nw:700000},{pct:70,nw:2000000},{pct:80,nw:4000000},{pct:90,nw:9000000},{pct:95,nw:18000000},{pct:99,nw:60000000}],
    "60+"  :[{pct:25,nw:200000},{pct:50,nw:900000},{pct:70,nw:2500000},{pct:80,nw:5000000},{pct:90,nw:11000000},{pct:95,nw:22000000},{pct:99,nw:70000000}],
    "all"  :[{pct:25,nw:20000},{pct:50,nw:80000},{pct:60,nw:150000},{pct:70,nw:350000},{pct:80,nw:900000},{pct:85,nw:1500000},{pct:90,nw:3000000},{pct:95,nw:7000000},{pct:99,nw:30000000}],
  };

  // ── Net Worth: World by age — Credit Suisse Global Wealth Report 2023 ────
  // Median adult wealth globally ~USD 8,654 (~₹718K). Distribution heavily skewed.
  const WORLD_NW_BY_AGE={
    "20-29":[{pct:25,nw:10000},{pct:50,nw:60000},{pct:70,nw:250000},{pct:80,nw:700000},{pct:90,nw:2000000},{pct:95,nw:5000000},{pct:99,nw:25000000}],
    "30-39":[{pct:25,nw:50000},{pct:50,nw:300000},{pct:70,nw:1000000},{pct:80,nw:2500000},{pct:90,nw:6000000},{pct:95,nw:14000000},{pct:99,nw:60000000}],
    "40-49":[{pct:25,nw:100000},{pct:50,nw:600000},{pct:70,nw:2000000},{pct:80,nw:5000000},{pct:90,nw:12000000},{pct:95,nw:25000000},{pct:99,nw:100000000}],
    "50-59":[{pct:25,nw:150000},{pct:50,nw:900000},{pct:70,nw:3000000},{pct:80,nw:7000000},{pct:90,nw:16000000},{pct:95,nw:35000000},{pct:99,nw:140000000}],
    "60+"  :[{pct:25,nw:180000},{pct:50,nw:1000000},{pct:70,nw:3500000},{pct:80,nw:8000000},{pct:90,nw:18000000},{pct:95,nw:40000000},{pct:99,nw:160000000}],
    "all"  :[{pct:25,nw:40000},{pct:50,nw:720000},{pct:60,nw:1500000},{pct:70,nw:3500000},{pct:80,nw:8000000},{pct:90,nw:16600000},{pct:95,nw:35000000},{pct:99,nw:83000000}],
    // Source: Credit Suisse Global Wealth Report 2023. Median adult wealth ~USD 8,654 (~₹718K at ₹83/USD).
    // Global wealth is extremely concentrated — bottom 50% own <1% of total.
  };

  // ── Income: India by age — PLFS 2022-23 estimates ─────────────────────────
  const INDIA_INCOME_BY_AGE={
    "20-29":[{pct:25,monthly:8000},{pct:50,monthly:14000},{pct:75,monthly:28000},{pct:90,monthly:60000},{pct:99,monthly:200000}],
    "30-39":[{pct:25,monthly:12000},{pct:50,monthly:22000},{pct:75,monthly:45000},{pct:90,monthly:110000},{pct:99,monthly:500000}],
    "40-49":[{pct:25,monthly:10000},{pct:50,monthly:20000},{pct:75,monthly:42000},{pct:90,monthly:100000},{pct:99,monthly:450000}],
    "50-59":[{pct:25,monthly:8000},{pct:50,monthly:16000},{pct:75,monthly:32000},{pct:90,monthly:75000},{pct:99,monthly:300000}],
    "60+"  :[{pct:25,monthly:5000},{pct:50,monthly:10000},{pct:75,monthly:20000},{pct:90,monthly:45000},{pct:99,monthly:150000}],
    "all"  :[{pct:10,monthly:4000},{pct:20,monthly:7000},{pct:30,monthly:10000},{pct:40,monthly:14000},{pct:50,monthly:19000},{pct:60,monthly:26000},{pct:70,monthly:36000},{pct:80,monthly:55000},{pct:90,monthly:100000},{pct:95,monthly:160000},{pct:99,monthly:400000}],
  };

  const AGE_GROUPS=["20-29","30-39","40-49","50-59","60+","all"];

  const [myIncome,setMyIncome]=React.useState(100000);
  const [myNW,setMyNW]=React.useState(2000000);
  const [myAge,setMyAge]=React.useState("30-39");

  const calcPct=(arr,val,key)=>{
    for(let i=arr.length-1;i>=0;i--) if(val>=arr[i][key]) return arr[i].pct;
    return 1;
  };

  const indiaPct=calcPct(INDIA_INCOME,myIncome,"monthly");
  const worldPct=calcPct(WORLD_INCOME,myIncome,"monthly");
  const indiaAgePct=calcPct(INDIA_INCOME_BY_AGE[myAge]||INDIA_INCOME_BY_AGE["all"],myIncome,"monthly");
  const indiaNWPct=calcPct(INDIA_NW_BY_AGE["all"],myNW,"nw");
  const indiaNWAgePct=calcPct(INDIA_NW_BY_AGE[myAge]||INDIA_NW_BY_AGE["all"],myNW,"nw");
  const worldNWPct=calcPct(WORLD_NW_BY_AGE["all"],myNW,"nw");
  const worldNWAgePct=calcPct(WORLD_NW_BY_AGE[myAge]||WORLD_NW_BY_AGE["all"],myNW,"nw");

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* ── SINGLE INPUT PANEL ── */}
      <div className="card" style={{borderColor:"#f59e0b30"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"#1f2328",marginBottom:4}}>Tell us about yourself</div>
        <div style={{fontSize:11,color:"#444c56",marginBottom:20,lineHeight:1.6}}>
          Enter your details once — we'll show where you stand across income, net worth, age group, and the world.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,alignItems:"start"}}>
          <div>
            <Field label="Monthly Income (In-hand)" value={myIncome} onChange={setMyIncome} prefix="₹" step={5000} min={0} color="#0d9373"
              hint="Take-home after tax and deductions"/>
          </div>
          <div>
            <Field label="Net Worth" value={myNW} onChange={setMyNW} prefix="₹" step={100000} min={0} color="#a78bfa"
              hint="Savings + investments + property − liabilities"/>
          </div>
          <div>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Age Group</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {AGE_GROUPS.map(g=>(
                <div key={g} onClick={()=>setMyAge(g)}
                  style={{padding:"6px 11px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,
                    background:myAge===g?"#f59e0b":"#f6f8fa",color:myAge===g?"#f6f8fa":"#6b7280",
                    border:`1px solid ${myAge===g?"#f59e0b":"#d0d7de"}`,transition:"all 0.15s"}}>
                  {g==="all"?"All":g}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DATA SOURCES ── */}
      <div style={{background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,padding:"10px 14px",fontSize:10,color:"#444c56",lineHeight:1.8}}>
        <strong style={{color:"#0d9373"}}>Data Sources — </strong>
        🇮🇳 India Income: CBDT ITR filings, CMIE Consumer Pyramids, PLFS 2022-23 &nbsp;·&nbsp;
        🌍 World Income: World Bank PIP 2023 (PPP ₹83/USD) &nbsp;·&nbsp;
        💰 Net Worth: Credit Suisse Global Wealth Report 2023 &nbsp;·&nbsp;
        All figures are estimates.
      </div>

      {/* ── INCOME RESULTS ── */}
      <div className="card" style={{borderColor:"#10b98130"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#0d9373",marginBottom:16}}>💰 Income — Where You Stand</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"India — All Ages",pct:indiaPct,color:"#0d9373",sub:"richer than % of all Indians",src:"ITR / CMIE"},
            {label:`India — Age ${myAge==="all"?"All":myAge}`,pct:indiaAgePct,color:"#059669",sub:`vs Indians aged ${myAge==="all"?"all ages":myAge}`,src:"PLFS 2022-23"},
            {label:"World — All Ages",pct:worldPct,color:"#3b82f6",sub:"richer than % of world",src:"World Bank PIP 2023"},
          ].map(({label,pct,color,sub,src})=>(
            <div key={label} style={{background:"#f6f8fa",border:`1px solid ${color}30`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:5}}>{label}</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:32,color,lineHeight:1}}>{pct}%</div>
              <div style={{fontSize:10,color:"#444c56",margin:"5px 0"}}>{sub}</div>
              <SourceBadge text={src}/>
            </div>
          ))}
        </div>
        <PercentileBar pct={indiaPct} color="#0d9373" label={`India overall: top ${100-indiaPct}% of earners`}/>
        <PercentileBar pct={indiaAgePct} color="#059669" label={`India age ${myAge==="all"?"all":myAge}: top ${100-indiaAgePct}% of earners`}/>
        <PercentileBar pct={worldPct} color="#3b82f6" label={`World: top ${100-worldPct}% of earners`}/>
        <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <div style={{fontSize:9,color:"#0d9373",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,marginBottom:5}}>India Benchmarks <SourceBadge text="CMIE/ITR"/></div>
            {[{l:"Median",v:19000},{l:"Top 25%",v:44000},{l:"Top 10%",v:100000},{l:"Top 5%",v:160000},{l:"Top 1%",v:400000}].map(({l,v})=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",borderRadius:5,marginBottom:2,
                background:myIncome>=v?"#f0fdf9":"#f6f8fa",borderLeft:`2px solid ${myIncome>=v?"#0d9373":"#d0d7de"}`}}>
                <span style={{fontSize:10,color:myIncome>=v?"#0d9373":"#656d76"}}>{l}</span>
                <span style={{fontSize:10,fontWeight:600,color:myIncome>=v?"#0d9373":"#0d9373",fontFamily:"Syne"}}>{formatINR(v)}/mo</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,color:"#3b82f6",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,marginBottom:5}}>World Benchmarks (PPP ₹) <SourceBadge text="World Bank PIP"/></div>
            {[{l:"Median",v:16000},{l:"Top 30%",v:25000},{l:"Top 20%",v:40000},{l:"Top 10%",v:125000},{l:"Top 1%",v:830000}].map(({l,v})=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",borderRadius:5,marginBottom:2,
                background:myIncome>=v?"#eff6ff":"#f6f8fa",borderLeft:`2px solid ${myIncome>=v?"#3b82f6":"#d0d7de"}`}}>
                <span style={{fontSize:10,color:myIncome>=v?"#93c5fd":"#656d76"}}>{l}</span>
                <span style={{fontSize:10,fontWeight:600,color:myIncome>=v?"#3b82f6":"#0d9373",fontFamily:"Syne"}}>{formatINR(v)}/mo</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:10,background:"#f6f8fa",borderRadius:6,padding:"7px 10px",fontSize:10,color:"#444c56",lineHeight:1.6}}>
          💡 World income is PPP-adjusted — purchasing power in India may rank you higher than raw numbers suggest.
        </div>
      </div>

      {/* ── NET WORTH RESULTS ── */}
      <div className="card" style={{borderColor:"#a78bfa30"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#a78bfa",marginBottom:16}}>🏦 Net Worth — Where You Stand</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"India — All Ages",pct:indiaNWPct,color:"#a78bfa",sub:"wealthier than % of all Indians",src:"Credit Suisse 2023"},
            {label:`India — Age ${myAge==="all"?"All":myAge}`,pct:indiaNWAgePct,color:"#c084fc",sub:`vs Indians aged ${myAge==="all"?"all ages":myAge}`,src:"Credit Suisse 2023"},
            {label:"World — All Ages",pct:worldNWPct,color:"#60a5fa",sub:"wealthier than % of world",src:"Credit Suisse 2023"},
            {label:`World — Age ${myAge==="all"?"All":myAge}`,pct:worldNWAgePct,color:"#818cf8",sub:`vs world aged ${myAge==="all"?"all ages":myAge}`,src:"Credit Suisse 2023"},
          ].map(({label,pct,color,sub,src})=>(
            <div key={label} style={{background:"#f6f8fa",border:`1px solid ${color}30`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:5}}>{label}</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:32,color,lineHeight:1}}>{pct}%</div>
              <div style={{fontSize:10,color:"#444c56",margin:"5px 0"}}>{sub}</div>
              <SourceBadge text={src}/>
            </div>
          ))}
        </div>
        <PercentileBar pct={indiaNWPct} color="#a78bfa" label={`India overall: top ${100-indiaNWPct}% by net worth`}/>
        <PercentileBar pct={indiaNWAgePct} color="#c084fc" label={`India age ${myAge==="all"?"all":myAge}: top ${100-indiaNWAgePct}% by net worth`}/>
        <PercentileBar pct={worldNWPct} color="#60a5fa" label={`World: top ${100-worldNWPct}% by net worth`}/>
        <PercentileBar pct={worldNWAgePct} color="#818cf8" label={`World age ${myAge==="all"?"all":myAge}: top ${100-worldNWAgePct}% by net worth`}/>
        <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <div style={{fontSize:9,color:"#a78bfa",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,marginBottom:5}}>India Benchmarks <SourceBadge text="Credit Suisse 2023"/></div>
            {[{l:"Median",v:80000},{l:"Top 30%",v:350000},{l:"Top 10%",v:3000000},{l:"Top 5%",v:7000000},{l:"Top 1%",v:30000000}].map(({l,v})=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",borderRadius:5,marginBottom:2,
                background:myNW>=v?"#f3f0ff":"#f6f8fa",borderLeft:`2px solid ${myNW>=v?"#a78bfa":"#d0d7de"}`}}>
                <span style={{fontSize:10,color:myNW>=v?"#c4b5fd":"#656d76"}}>{l}</span>
                <span style={{fontSize:10,fontWeight:600,color:myNW>=v?"#a78bfa":"#0d9373",fontFamily:"Syne"}}>{formatINR(v)}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,color:"#60a5fa",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,marginBottom:5}}>World Benchmarks (PPP ₹) <SourceBadge text="Credit Suisse 2023"/></div>
            {[{l:"Median",v:720000},{l:"Top 30%",v:3500000},{l:"Top 10%",v:16600000},{l:"Top 5%",v:35000000},{l:"Top 1%",v:83000000}].map(({l,v})=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",borderRadius:5,marginBottom:2,
                background:myNW>=v?"#eff6ff":"#f6f8fa",borderLeft:`2px solid ${myNW>=v?"#60a5fa":"#d0d7de"}`}}>
                <span style={{fontSize:10,color:myNW>=v?"#93c5fd":"#656d76"}}>{l}</span>
                <span style={{fontSize:10,fontWeight:600,color:myNW>=v?"#60a5fa":"#0d9373",fontFamily:"Syne"}}>{formatINR(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:10,background:"#f6f8fa",borderRadius:6,padding:"7px 10px",fontSize:10,color:"#444c56",lineHeight:1.6}}>
          💡 A ₹50L apartment alone puts you in India's top 10% by net worth. The median Indian has very little <em>financial</em> net worth.
          Age-adjusted rankings are often more meaningful — accumulating ₹50L at 28 is very different from the same at 55.
        </div>
      </div>
    </div>
  );
}


// ─── CITY COSTS PAGE ──────────────────────────────────────────────────────────
function CityCostsPage(){
  // Extended city data with detailed cost breakdown
  // All costs in INR/month. Sources: Numbeo, MagicBricks, local surveys (estimates)
  const CITIES=[
    {name:"Mumbai",      idx:100,global:false,
      rent1bhk:35000,rent2bhk:65000,
      groceries:6000,diningOut:8000,
      localTransport:2500,petrolCar:5000,
      electricity:2500,water:300,internet:700,
      domesticHelp:5000,
      gymFitness:2000,entertainment:4000,
      schoolFees:15000,
      healthcare:3000,
      note:"India's financial capital. South Mumbai & BKC premium; suburbs more affordable."},
    {name:"Delhi NCR",   idx:88, global:false,
      rent1bhk:25000,rent2bhk:50000,
      groceries:5500,diningOut:7000,
      localTransport:2000,petrolCar:4500,
      electricity:2000,water:200,internet:600,
      domesticHelp:4500,
      gymFitness:1800,entertainment:3500,
      schoolFees:12000,
      healthcare:2500,
      note:"Huge variation — Central Delhi vs NCR (Gurgaon/Noida) differ significantly."},
    {name:"Bangalore",   idx:90, global:false,
      rent1bhk:28000,rent2bhk:55000,
      groceries:5800,diningOut:7500,
      localTransport:2200,petrolCar:4800,
      electricity:1800,water:250,internet:700,
      domesticHelp:5000,
      gymFitness:2000,entertainment:4000,
      schoolFees:14000,
      healthcare:2800,
      note:"IT hub. Traffic is notorious — many opt for accommodation near office."},
    {name:"Hyderabad",   idx:80, global:false,
      rent1bhk:20000,rent2bhk:38000,
      groceries:5000,diningOut:6000,
      localTransport:2000,petrolCar:4200,
      electricity:1500,water:200,internet:600,
      domesticHelp:4000,
      gymFitness:1500,entertainment:3000,
      schoolFees:10000,
      healthcare:2200,
      note:"Fastest growing metro. Excellent value for money vs Bangalore/Mumbai."},
    {name:"Chennai",     idx:78, global:false,
      rent1bhk:18000,rent2bhk:35000,
      groceries:5000,diningOut:5500,
      localTransport:1800,petrolCar:4000,
      electricity:1400,water:200,internet:600,
      domesticHelp:3800,
      gymFitness:1500,entertainment:2800,
      schoolFees:10000,
      healthcare:2000,
      note:"South India's gateway. Conservative spending culture; good schools."},
    {name:"Pune",        idx:82, global:false,
      rent1bhk:22000,rent2bhk:42000,
      groceries:5200,diningOut:6000,
      localTransport:2000,petrolCar:4300,
      electricity:1600,water:220,internet:650,
      domesticHelp:4200,
      gymFitness:1600,entertainment:3200,
      schoolFees:11000,
      healthcare:2300,
      note:"Student and IT city. Comfortable living at lower cost than Bangalore."},
    {name:"Kolkata",     idx:70, global:false,
      rent1bhk:14000,rent2bhk:26000,
      groceries:4500,diningOut:5000,
      localTransport:1500,petrolCar:3800,
      electricity:1300,water:150,internet:550,
      domesticHelp:3500,
      gymFitness:1200,entertainment:2500,
      schoolFees:8000,
      healthcare:1800,
      note:"Most affordable major metro. Rich cultural life at low cost."},
    {name:"Ahmedabad",   idx:72, global:false,
      rent1bhk:15000,rent2bhk:28000,
      groceries:4800,diningOut:5200,
      localTransport:1600,petrolCar:3900,
      electricity:1200,water:180,internet:550,
      domesticHelp:3800,
      gymFitness:1300,entertainment:2600,
      schoolFees:8500,
      healthcare:1900,
      note:"Thriving business city. Low cost, strong entrepreneurial culture."},
    {name:"Jaipur",      idx:65, global:false,
      rent1bhk:12000,rent2bhk:22000,
      groceries:4200,diningOut:4500,
      localTransport:1400,petrolCar:3600,
      electricity:1100,water:150,internet:500,
      domesticHelp:3200,
      gymFitness:1100,entertainment:2200,
      schoolFees:7000,
      healthcare:1600,
      note:"Pink city. Affordable with growing IT sector."},
    {name:"Kochi",       idx:75, global:false,
      rent1bhk:16000,rent2bhk:30000,
      groceries:5000,diningOut:5500,
      localTransport:1800,petrolCar:4200,
      electricity:1300,water:200,internet:600,
      domesticHelp:4000,
      gymFitness:1400,entertainment:2800,
      schoolFees:9000,
      healthcare:2000,
      note:"Kerala's commercial hub. High quality of life, good healthcare."},
    {name:"Singapore",   idx:280,global:true,
      rent1bhk:175000,rent2bhk:280000,
      groceries:18000,diningOut:22000,
      localTransport:8000,petrolCar:60000,
      electricity:8000,water:2000,internet:3000,
      domesticHelp:15000,
      gymFitness:6000,entertainment:15000,
      schoolFees:80000,
      healthcare:12000,
      note:"No income tax but extremely high cost of living. Car ownership very expensive."},
    {name:"Dubai",       idx:220,global:true,
      rent1bhk:130000,rent2bhk:220000,
      groceries:15000,diningOut:20000,
      localTransport:6000,petrolCar:15000,
      electricity:10000,water:3000,internet:4000,
      domesticHelp:12000,
      gymFitness:5000,entertainment:12000,
      schoolFees:60000,
      healthcare:10000,
      note:"No income tax. School fees very high. Petrol cheap but rent is steep."},
    {name:"London",      idx:320,global:true,
      rent1bhk:220000,rent2bhk:380000,
      groceries:22000,diningOut:28000,
      localTransport:20000,petrolCar:30000,
      electricity:15000,water:4000,internet:4000,
      domesticHelp:40000,
      gymFitness:8000,entertainment:18000,
      schoolFees:0,
      healthcare:0,
      note:"NHS covers healthcare. State schools free. Transport expensive. Very high rent."},
    {name:"New York",    idx:380,global:true,
      rent1bhk:280000,rent2bhk:450000,
      groceries:25000,diningOut:35000,
      localTransport:18000,petrolCar:25000,
      electricity:12000,water:3500,internet:5000,
      domesticHelp:50000,
      gymFitness:10000,entertainment:22000,
      schoolFees:0,
      healthcare:30000,
      note:"Public schools free. Healthcare expensive without employer coverage. Subway is reliable."},
    {name:"Bangkok",     idx:90, global:true,
      rent1bhk:28000,rent2bhk:55000,
      groceries:7000,diningOut:8000,
      localTransport:3000,petrolCar:5000,
      electricity:5000,water:800,internet:1500,
      domesticHelp:8000,
      gymFitness:2500,entertainment:7000,
      schoolFees:25000,
      healthcare:4000,
      note:"Popular expat destination. Similar cost to Indian metros but more amenities."},
    {name:"Kuala Lumpur",idx:95, global:true,
      rent1bhk:30000,rent2bhk:58000,
      groceries:7500,diningOut:9000,
      localTransport:3500,petrolCar:6000,
      electricity:4000,water:800,internet:1500,
      domesticHelp:8000,
      gymFitness:2800,entertainment:7500,
      schoolFees:28000,
      healthcare:4500,
      note:"Affordable expat destination. Good infrastructure. Petrol subsidised."},
    {name:"Sydney",      idx:300,global:true,
      rent1bhk:210000,rent2bhk:350000,
      groceries:20000,diningOut:25000,
      localTransport:15000,petrolCar:22000,
      electricity:12000,water:3000,internet:4000,
      domesticHelp:45000,
      gymFitness:7000,entertainment:18000,
      schoolFees:0,
      healthcare:0,
      note:"Public schools and healthcare (Medicare) covered. High wages offset high costs."},
    {name:"Toronto",     idx:290,global:true,
      rent1bhk:200000,rent2bhk:340000,
      groceries:19000,diningOut:23000,
      localTransport:13000,petrolCar:20000,
      electricity:10000,water:3000,internet:4500,
      domesticHelp:42000,
      gymFitness:6500,entertainment:16000,
      schoolFees:0,
      healthcare:0,
      note:"Universal healthcare and free public schools. Winters harsh. High immigration."},
  ];

  const COST_CATEGORIES=[
    {key:"rent1bhk",      label:"Rent — 1BHK",          color:"#3b82f6",  icon:"🏠"},
    {key:"rent2bhk",      label:"Rent — 2BHK",          color:"#60a5fa",  icon:"🏡"},
    {key:"groceries",     label:"Groceries",             color:"#0d9373",  icon:"🛒"},
    {key:"diningOut",     label:"Dining Out",            color:"#059669",  icon:"🍽️"},
    {key:"localTransport",label:"Local Transport",       color:"#a78bfa",  icon:"🚇"},
    {key:"petrolCar",     label:"Petrol (Car owner)",    color:"#c084fc",  icon:"⛽"},
    {key:"electricity",   label:"Electricity",           color:"#f59e0b",  icon:"⚡"},
    {key:"water",         label:"Water",                 color:"#38bdf8",  icon:"💧"},
    {key:"internet",      label:"Internet + OTT",        color:"#818cf8",  icon:"📡"},
    {key:"domesticHelp",  label:"Domestic Help",         color:"#fb923c",  icon:"🧹"},
    {key:"gymFitness",    label:"Gym / Fitness",         color:"#f472b6",  icon:"💪"},
    {key:"entertainment", label:"Entertainment / Misc",  color:"#fbbf24",  icon:"🎬"},
    {key:"schoolFees",    label:"School Fees (1 child)", color:"#ec4899",  icon:"📚"},
    {key:"healthcare",    label:"Healthcare / Insurance", color:"#ef4444", icon:"🏥"},
  ];

  const [baseCity,setBaseCity]=React.useState("Mumbai");
  const [compareCity,setCompareCity]=React.useState("Bangalore");
  const [selectedCats,setSelectedCats]=React.useState(
    ["rent1bhk","groceries","diningOut","localTransport","electricity","internet","domesticHelp","entertainment"]
  );
  const toggleCat=k=>setSelectedCats(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);

  const base=CITIES.find(c=>c.name===baseCity);
  const compare=CITIES.find(c=>c.name===compareCity);
  const ratio=base&&compare?compare.idx/base.idx:1;

  const totalBase=base?selectedCats.reduce((s,k)=>s+(base[k]||0),0):0;
  const totalCompare=compare?selectedCats.reduce((s,k)=>s+(compare[k]||0),0):0;

  const indianCities=CITIES.filter(c=>!c.global);
  const allCities=CITIES;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,padding:"10px 16px",fontSize:11,color:"#444c56"}}>
        🏙️ Based on Numbeo, MagicBricks, and local cost surveys. Mumbai = 100 index baseline. All figures are approximate monthly estimates in INR. For reference only.
      </div>

      {/* City selector */}
      <div className="card" style={{borderColor:"#f59e0b30"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"#f59e0b",marginBottom:14}}>🏙️ Compare Two Cities</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          {[
            {label:"Your City",val:baseCity,set:setBaseCity,cities:indianCities},
            {label:"Compare With",val:compareCity,set:setCompareCity,cities:allCities},
          ].map(({label,val,set,cities})=>(
            <div key={label}>
              <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>{label}</div>
              <select value={val} onChange={e=>set(e.target.value)}
                style={{width:"100%",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,
                  color:"#1f2328",padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"DM Sans,sans-serif"}}>
                {cities.map(c=><option key={c.name} value={c.name}>{c.name}{c.global?" 🌍":""}</option>)}
              </select>
            </div>
          ))}
        </div>

        {base&&compare&&(<>
          {/* Ratio hero */}
          <div style={{background:"linear-gradient(135deg,#1a1800,#161b22)",border:"1px solid #f59e0b30",
            borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>Cost Ratio</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:34,color:"#f59e0b"}}>{ratio.toFixed(2)}x</div>
            </div>
            <div style={{fontSize:12,color:"#0d9373",lineHeight:1.8,flex:1}}>
              <strong style={{color:"#f59e0b"}}>{compareCity}</strong> is{" "}
              <strong style={{color:ratio>1?"#ef4444":"#0d9373"}}>
                {ratio>1?`${((ratio-1)*100).toFixed(0)}% more expensive`:`${((1-ratio)*100).toFixed(0)}% cheaper`}
              </strong> than <strong style={{color:"#f59e0b"}}>{baseCity}</strong>
              <br/><span style={{fontSize:10}}>Index: {compare.idx} vs {base.idx} · Selected costs: {formatINR(totalCompare)}/mo vs {formatINR(totalBase)}/mo</span>
            </div>
          </div>

          {/* City notes */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[base,compare].map(c=>(
              <div key={c.name} style={{background:"#f6f8fa",borderRadius:8,padding:"10px 12px",fontSize:11,color:"#444c56",lineHeight:1.6}}>
                <strong style={{color:"#f59e0b"}}>{c.name}</strong> — {c.note}
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* Category selector */}
      <div className="card">
        <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>
          Select Cost Categories to Include
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {COST_CATEGORIES.map(cat=>{
            const on=selectedCats.includes(cat.key);
            return(
              <div key={cat.key} onClick={()=>toggleCat(cat.key)}
                style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,
                  background:on?cat.color+"20":"transparent",color:on?cat.color:"#6b7280",
                  border:`1px solid ${on?cat.color:"#d0d7de"}`,transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}>
                <span>{cat.icon}</span>{cat.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed breakdown */}
      {base&&compare&&(
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#1f2328"}}>
              Cost Breakdown — {baseCity} vs {compareCity}
            </div>
            <div style={{display:"flex",gap:16,fontSize:12}}>
              <span style={{color:"#0d9373"}}>{baseCity} total: <strong style={{color:"#f59e0b",fontFamily:"Syne"}}>{formatINR(totalBase)}/mo</strong></span>
              <span style={{color:"#0d9373"}}>{compareCity} total: <strong style={{color:"#f59e0b",fontFamily:"Syne"}}>{formatINR(totalCompare)}/mo</strong></span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {COST_CATEGORIES.filter(cat=>selectedCats.includes(cat.key)).map(cat=>{
              const bv=base[cat.key]||0;
              const cv=compare[cat.key]||0;
              const mx=Math.max(bv,cv,1);
              const diff=cv-bv;
              const isZero=bv===0&&cv===0;
              return(
                <div key={cat.key} style={{padding:"10px 0",borderBottom:"1px solid #0f1f18"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:12,color:"#0d9373",display:"flex",alignItems:"center",gap:6}}>
                      <span>{cat.icon}</span>{cat.label}
                    </span>
                    <div style={{display:"flex",gap:20,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#57606a",minWidth:90,textAlign:"right"}}>{baseCity}: {bv===0?"incl./free":formatINR(bv)}</span>
                      <span style={{fontSize:12,fontWeight:600,color:cv>bv?"#ef4444":cv<bv?"#0d9373":"#9ca3af",minWidth:100,textAlign:"right"}}>{compareCity}: {cv===0?"incl./free":formatINR(cv)}</span>
                      {!isZero&&<span style={{fontSize:11,color:diff>0?"#ef4444":"#0d9373",minWidth:70,textAlign:"right",fontFamily:"Syne",fontWeight:700}}>
                        {diff===0?"same":diff>0?`+${formatINR(diff)}`:formatINR(diff)}
                      </span>}
                    </div>
                  </div>
                  {!isZero&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                      <div style={{height:5,borderRadius:3,background:"#d0d7de",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(bv/mx*100).toFixed(0)}%`,background:cat.color,opacity:0.5,borderRadius:3}}/>
                      </div>
                      <div style={{height:5,borderRadius:3,background:"#d0d7de",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(cv/mx*100).toFixed(0)}%`,background:cat.color,borderRadius:3}}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All cities reference table */}
      <div className="card">
        <div className="lbl" style={{marginBottom:14}}>All Cities — Monthly Cost Reference (INR)</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
            <thead>
              <tr style={{borderBottom:"1px solid #d0d7de"}}>
                <th style={{textAlign:"left",padding:"8px 10px",color:"#444c56",fontWeight:600,fontSize:10,whiteSpace:"nowrap"}}>City</th>
                <th style={{padding:"8px 6px",color:"#444c56",fontWeight:600,fontSize:10,textAlign:"center"}}>Idx</th>
                {COST_CATEGORIES.map(cat=>(
                  <th key={cat.key} style={{padding:"8px 8px",color:selectedCats.includes(cat.key)?"#0d9373":"#656d76",
                    fontWeight:600,fontSize:9,textAlign:"right",whiteSpace:"nowrap",
                    borderBottom:selectedCats.includes(cat.key)?`2px solid ${cat.color}`:"none",
                    cursor:"pointer"}}
                    onClick={()=>toggleCat(cat.key)}>
                    {cat.icon}
                  </th>
                ))}
                <th style={{padding:"8px 10px",color:"#f59e0b",fontWeight:600,fontSize:10,textAlign:"right",whiteSpace:"nowrap"}}>Selected Total</th>
              </tr>
            </thead>
            <tbody>
              {[...CITIES].sort((a,b)=>a.idx-b.idx).map((c,i)=>{
                const total=selectedCats.reduce((s,k)=>s+(c[k]||0),0);
                return(
                  <tr key={i} style={{borderBottom:"1px solid #0d1a12",
                    background:c.name===baseCity||c.name===compareCity?"#e8f4fd":c.global?"#f6f8fa":i%2===0?"#f6f8fa":"transparent"}}>
                    <td style={{padding:"8px 10px",whiteSpace:"nowrap",color:c.global?"#0d9373":"#1f2328",fontWeight:500}}>
                      {c.global?"🌍 ":""}{c.name}
                      {(c.name===baseCity||c.name===compareCity)&&<span style={{color:"#f59e0b",marginLeft:6,fontSize:9}}>●</span>}
                    </td>
                    <td style={{padding:"8px 6px",textAlign:"center",color:"#444c56",fontSize:10}}>{c.idx}</td>
                    {COST_CATEGORIES.map(cat=>(
                      <td key={cat.key} style={{padding:"8px 8px",textAlign:"right",
                        color:selectedCats.includes(cat.key)?cat.color:"#444c56",
                        opacity:selectedCats.includes(cat.key)?1:0.4,fontSize:11}}>
                        {c[cat.key]===0?"—":formatINR(c[cat.key])}
                      </td>
                    ))}
                    <td style={{padding:"8px 10px",textAlign:"right",color:"#f59e0b",fontWeight:600,fontFamily:"Syne",fontSize:12}}>
                      {formatINR(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:10,color:"#444c56",marginTop:8}}>
          💡 Click column headers (icons) to toggle categories. Highlighted rows = your selected cities. "incl./free" = included in general taxes or zero cost (e.g. public healthcare in UK/Australia).
        </div>
      </div>
    </div>
  );
}

// ─── PPP SALARY PAGE ─────────────────────────────────────────────────────────
function PPPPage(){
  // Cost index: Mumbai = 100 internally. Displayed relative to selected "Your City". fxRate = ₹ per 1 unit of currency.
  const CITIES=[
    // ── Indian Tier 1 ──
    {name:"Mumbai",          idx:100,global:false,region:"India"},
    {name:"Delhi NCR",       idx:88, global:false,region:"India"},
    {name:"Bangalore",       idx:90, global:false,region:"India"},
    {name:"Hyderabad",       idx:80, global:false,region:"India"},
    {name:"Chennai",         idx:78, global:false,region:"India"},
    {name:"Pune",            idx:82, global:false,region:"India"},
    {name:"Kolkata",         idx:70, global:false,region:"India"},
    // ── Indian Tier 2 ──
    {name:"Ahmedabad",       idx:72, global:false,region:"India"},
    {name:"Jaipur",          idx:65, global:false,region:"India"},
    {name:"Kochi",           idx:75, global:false,region:"India"},
    {name:"Chandigarh",      idx:70, global:false,region:"India"},
    {name:"Lucknow",         idx:62, global:false,region:"India"},
    {name:"Indore",          idx:60, global:false,region:"India"},
    {name:"Nagpur",          idx:58, global:false,region:"India"},
    {name:"Coimbatore",      idx:62, global:false,region:"India"},
    {name:"Bhubaneswar",     idx:57, global:false,region:"India"},
    {name:"Vizag",           idx:60, global:false,region:"India"},
    {name:"Surat",           idx:63, global:false,region:"India"},
    {name:"Vadodara",        idx:61, global:false,region:"India"},
    {name:"Bhopal",          idx:56, global:false,region:"India"},
    {name:"Patna",           idx:52, global:false,region:"India"},
    {name:"Guwahati",        idx:55, global:false,region:"India"},
    {name:"Thiruvananthapuram",idx:64,global:false,region:"India"},
    {name:"Mysore",          idx:62, global:false,region:"India"},
    {name:"Nashik",          idx:65, global:false,region:"India"},
    {name:"Goa",             idx:76, global:false,region:"India"},
    // ── Middle East ──
    {name:"Dubai",           idx:220,global:true,region:"Middle East",currency:"AED",fxRate:22.6},
    {name:"Abu Dhabi",       idx:230,global:true,region:"Middle East",currency:"AED",fxRate:22.6},
    {name:"Riyadh",          idx:190,global:true,region:"Middle East",currency:"SAR",fxRate:22.1},
    {name:"Doha",            idx:210,global:true,region:"Middle East",currency:"QAR",fxRate:22.8},
    {name:"Kuwait City",     idx:180,global:true,region:"Middle East",currency:"KWD",fxRate:270},
    {name:"Muscat",          idx:160,global:true,region:"Middle East",currency:"OMR",fxRate:216},
    {name:"Bahrain",         idx:155,global:true,region:"Middle East",currency:"BHD",fxRate:220},
    // ── Southeast Asia ──
    {name:"Singapore",       idx:280,global:true,region:"SE Asia",currency:"SGD",fxRate:62},
    {name:"Bangkok",         idx:90, global:true,region:"SE Asia",currency:"THB",fxRate:2.3},
    {name:"Kuala Lumpur",    idx:95, global:true,region:"SE Asia",currency:"MYR",fxRate:17.8},
    {name:"Jakarta",         idx:75, global:true,region:"SE Asia",currency:"IDR",fxRate:0.005},
    {name:"Manila",          idx:70, global:true,region:"SE Asia",currency:"PHP",fxRate:1.48},
    {name:"Ho Chi Minh City",idx:72, global:true,region:"SE Asia",currency:"VND",fxRate:0.003},
    {name:"Colombo",         idx:60, global:true,region:"SE Asia",currency:"LKR",fxRate:0.25},
    {name:"Dhaka",           idx:45, global:true,region:"SE Asia",currency:"BDT",fxRate:0.75},
    // ── East Asia ──
    {name:"Tokyo",           idx:210,global:true,region:"East Asia",currency:"JPY",fxRate:0.55},
    {name:"Hong Kong",       idx:310,global:true,region:"East Asia",currency:"HKD",fxRate:10.6},
    {name:"Shanghai",        idx:180,global:true,region:"East Asia",currency:"CNY",fxRate:11.4},
    {name:"Beijing",         idx:185,global:true,region:"East Asia",currency:"CNY",fxRate:11.4},
    {name:"Seoul",           idx:200,global:true,region:"East Asia",currency:"KRW",fxRate:0.062},
    {name:"Taipei",          idx:170,global:true,region:"East Asia",currency:"TWD",fxRate:2.6},
    // ── Europe ──
    {name:"London",          idx:320,global:true,region:"Europe",currency:"GBP",fxRate:106},
    {name:"Frankfurt",       idx:270,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Paris",           idx:285,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Amsterdam",       idx:280,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Zurich",          idx:380,global:true,region:"Europe",currency:"CHF",fxRate:94},
    {name:"Dublin",          idx:300,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Berlin",          idx:240,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Madrid",          idx:220,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Milan",           idx:245,global:true,region:"Europe",currency:"EUR",fxRate:90},
    {name:"Stockholm",       idx:295,global:true,region:"Europe",currency:"SEK",fxRate:7.8},
    {name:"Warsaw",          idx:160,global:true,region:"Europe",currency:"PLN",fxRate:21},
    {name:"Lisbon",          idx:200,global:true,region:"Europe",currency:"EUR",fxRate:90},
    // ── North America ──
    {name:"New York",        idx:380,global:true,region:"North America",currency:"USD",fxRate:83},
    {name:"San Francisco",   idx:420,global:true,region:"North America",currency:"USD",fxRate:83},
    {name:"Seattle",         idx:350,global:true,region:"North America",currency:"USD",fxRate:83},
    {name:"Chicago",         idx:310,global:true,region:"North America",currency:"USD",fxRate:83},
    {name:"Austin",          idx:290,global:true,region:"North America",currency:"USD",fxRate:83},
    {name:"Dallas",          idx:270,global:true,region:"North America",currency:"USD",fxRate:83},
    {name:"Toronto",         idx:290,global:true,region:"North America",currency:"CAD",fxRate:61},
    {name:"Vancouver",       idx:310,global:true,region:"North America",currency:"CAD",fxRate:61},
    {name:"Montreal",        idx:250,global:true,region:"North America",currency:"CAD",fxRate:61},
    {name:"Mexico City",     idx:90, global:true,region:"North America",currency:"MXN",fxRate:4.8},
    // ── Oceania ──
    {name:"Sydney",          idx:300,global:true,region:"Oceania",currency:"AUD",fxRate:54},
    {name:"Melbourne",       idx:290,global:true,region:"Oceania",currency:"AUD",fxRate:54},
    {name:"Brisbane",        idx:270,global:true,region:"Oceania",currency:"AUD",fxRate:54},
    {name:"Auckland",        idx:280,global:true,region:"Oceania",currency:"NZD",fxRate:50},
    // ── Africa ──
    {name:"Johannesburg",    idx:110,global:true,region:"Africa",currency:"ZAR",fxRate:4.5},
    {name:"Nairobi",         idx:75, global:true,region:"Africa",currency:"KES",fxRate:0.64},
    {name:"Lagos",           idx:60, global:true,region:"Africa",currency:"NGN",fxRate:0.055},
    {name:"Cairo",           idx:55, global:true,region:"Africa",currency:"EGP",fxRate:1.7},
  ];

  const [fromCity,setFromCity]=React.useState("Bangalore");
  const [toCity,setToCity]=React.useState("New York");
  const [salary,setSalary]=React.useState(150000);

  const from=CITIES.find(c=>c.name===fromCity);
  const to=CITIES.find(c=>c.name===toCity);
  const pppRatio=from&&to?to.idx/from.idx:1;
  const pppEquiv=Math.round(salary*pppRatio);
  const diff=pppEquiv-salary;
  const localCurrencyEquiv=to?.global?Math.round(pppEquiv/(to.fxRate||1)):null;

  const allComparisons=useMemo(()=>
    [...CITIES].map(c=>({
      name:c.name,global:c.global,idx:c.idx,
      equiv:Math.round(salary*c.idx/(from?.idx||100)),
      ratio:c.idx/(from?.idx||100),
      currency:c.currency||"INR",fxRate:c.fxRate||1,
    })).sort((a,b)=>a.equiv-b.equiv)
  ,[salary,fromCity,from]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,padding:"10px 16px",fontSize:11,color:"#444c56",lineHeight:1.6}}>
        💼 <strong style={{color:"#0d9373"}}>Purchasing Power Parity (PPP)</strong> adjusts salaries for local cost of living.
        A ₹1.5L salary in Bangalore and $4,000 in New York may feel equally comfortable — because what you can buy differs vastly.
        Cost index is displayed relative to your selected city (1.00x). Source: Numbeo estimates.
      </div>

      {/* Main calculator */}
      <div className="card" style={{borderColor:"#10b98130"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"#0d9373",marginBottom:16}}>💼 PPP Salary Calculator</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16,alignItems:"end"}}>
          {[
            {label:"Your City",val:fromCity,set:setFromCity},
            {label:"Target City",val:toCity,set:setToCity},
          ].map(({label,val,set})=>{
            const regions=[...new Set(CITIES.map(c=>c.region))];
            return(
              <div key={label}>
                <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>{label}</div>
                <select value={val} onChange={e=>set(e.target.value)}
                  style={{width:"100%",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,
                    color:"#1f2328",padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"DM Sans,sans-serif"}}>
                  {regions.map(region=>(
                    <optgroup key={region} label={`── ${region} ──`}
                      style={{color:"#444c56",background:"#f6f8fa"}}>
                      {CITIES.filter(c=>c.region===region).map(c=>(
                        <option key={c.name} value={c.name}>{c.name}{c.global?` (${c.currency})`:""}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            );
          })}
          <Field label="Your Monthly Salary" value={salary} onChange={setSalary} prefix="₹" step={5000} min={0} color="#0d9373"/>
        </div>

        {from&&to&&(<>
          <div style={{background:"linear-gradient(135deg,#0d1a14,#0d1a14)",border:"1px solid #10b981",
            borderRadius:12,padding:"20px 24px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
              <div>
                <div style={{fontSize:10,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>
                  To live like {formatINR(salary)}/mo in {fromCity}, you need in {toCity}
                </div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",color:"#0d9373"}}>
                  {formatINR(pppEquiv)}<span style={{fontSize:14,color:"#444c56",marginLeft:4}}>/mo</span>
                </div>
                {localCurrencyEquiv&&(
                  <div style={{fontSize:13,color:"#0d9373",marginTop:6}}>
                    ≈ <strong style={{color:"#059669"}}>{to.currency} {localCurrencyEquiv.toLocaleString()}</strong>/mo
                    <span style={{fontSize:11,color:"#444c56",marginLeft:6}}>(at ₹{to.fxRate}/{to.currency})</span>
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:20}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>Cost Ratio</div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:24,color:"#f59e0b"}}>{pppRatio.toFixed(2)}x</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>
                    {diff>0?"Need More":"Need Less"}
                  </div>
                  <div style={{fontFamily:"Syne",fontWeight:800,fontSize:24,color:diff>0?"#ef4444":"#0d9373"}}>
                    {diff>0?"+":""}{formatINR(diff)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {[
              {label:`Purchasing Power in ${toCity}`,pct:`${(1/pppRatio*100).toFixed(0)}%`,color:"#a78bfa",
               sub:`₹1 in ${fromCity} = ₹${(1/pppRatio).toFixed(2)} in ${toCity}`},
              {label:"Cost Index",pct:`1.00x → ${pppRatio.toFixed(2)}x`,color:"#f59e0b",sub:`${fromCity} = 1.00x baseline`},
              {label:"Annual Equivalent",val:pppEquiv*12,color:"#3b82f6",sub:`vs ${formatINR(salary*12)} today`},
              {label:"Monthly Difference",val:Math.abs(diff),color:diff>0?"#ef4444":"#0d9373",
               sub:diff>0?`more needed in ${toCity}`:`less needed in ${toCity}`},
            ].map(({label,val,color,sub,pct})=>(
              <div key={label} style={{background:"#f6f8fa",borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${color}`}}>
                <div style={{fontSize:9,color:"#444c56",marginBottom:5,textTransform:"uppercase",letterSpacing:"1px"}}>{label}</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color}}>{val!=null?formatINR(val):pct}</div>
                <div style={{fontSize:10,color:"#444c56",marginTop:3}}>{sub}</div>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* Multi-city comparison */}
      <div className="card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#1f2328"}}>
              {formatINR(salary)}/mo in {fromCity} — Equivalent Across All Cities
            </div>
            <div style={{fontSize:11,color:"#444c56",marginTop:2}}>Sorted cheapest → most expensive</div>
          </div>

        </div>

        {/* Bar chart */}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600}}>Visual Comparison</div>
            <div style={{fontSize:10,color:"#444c56"}}>{fromCity} = 1.00x baseline</div>
          </div>
          {allComparisons.map((c,i)=>{
            const maxEquiv=allComparisons[allComparisons.length-1].equiv;
            const barPct=Math.max((c.equiv/maxEquiv*100),2);
            const color=c.ratio<=0.85?"#0d9373":c.ratio<=1.1?"#34d399":c.ratio<=1.5?"#f59e0b":c.ratio<=2.5?"#fb923c":"#ef4444";
            const isFrom=c.name===fromCity;
            const isTo=c.name===toCity;
            // Show index label inside bar if bar is wide enough, otherwise outside
            const showInside=barPct>22;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:11,color:isFrom?"#0d9373":isTo?"#f59e0b":"#0d9373",
                  width:130,flexShrink:0,textAlign:"right",fontWeight:isFrom||isTo?700:400,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                <div style={{flex:1,height:20,borderRadius:4,background:"#d0d7de",overflow:"visible",position:"relative"}}>
                  <div style={{height:"100%",width:`${barPct.toFixed(0)}%`,background:color,borderRadius:4,
                    border:isFrom||isTo?`1.5px solid ${isFrom?"#0d9373":"#f59e0b"}`:"none",
                    display:"flex",alignItems:"center",justifyContent:"flex-end",position:"relative",overflow:"visible"}}>
                    <span style={{position:"absolute",right:showInside?6:-38,fontSize:9,fontWeight:700,
                      color:showInside?"#f6f8fa":color,whiteSpace:"nowrap",letterSpacing:"0.5px",lineHeight:"20px"}}>
                      {c.ratio===1?"1.00x":c.ratio.toFixed(2)+"x"}
                    </span>
                  </div>
                </div>
                <div style={{width:130,flexShrink:0,textAlign:"right"}}>
                  <div style={{display:"flex",alignItems:"baseline",justifyContent:"flex-end",gap:6}}>
                    <div style={{fontSize:11,color,fontFamily:"Syne",fontWeight:600}}>{formatINR(c.equiv)}</div>
                    {c.global&&c.fxRate?(
                      <div style={{fontSize:9,color:"#444c56",whiteSpace:"nowrap"}}>
                        {c.currency} {Math.round(c.equiv/c.fxRate).toLocaleString()}
                      </div>
                    ):(
                      <div style={{fontSize:9,color:"#2a4a35"}}>INR</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── GLOBAL STOCKS PAGE ───────────────────────────────────────────────────────
function GlobalStocksPage(){
  // Top publicly listed Fortune 500 / global large-caps
  // Returns: approximate historical CAGR in local currency
  // Sources: Bloomberg, Yahoo Finance, company reports (illustrative estimates)
  // Grouped by country/region
  const STOCKS=[
    // ── United States ──
    {name:"Apple",          ticker:"AAPL", country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#60a5fa",r:{h6:12,y1:30,y2:14,y3:28,y5:32,y10:30,y15:38,y20:35}},
    {name:"Microsoft",      ticker:"MSFT", country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#818cf8",r:{h6:8, y1:18,y2:16,y3:24,y5:30,y10:28,y15:30,y20:22}},
    {name:"Nvidia",         ticker:"NVDA", country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#0d9373",r:{h6:80,y1:220,y2:80,y3:100,y5:120,y10:90,y15:70,y20:55}},
    {name:"Alphabet (Google)",ticker:"GOOGL",country:"🇺🇸 USA", currency:"USD",sector:"Technology",   color:"#059669",r:{h6:10,y1:22,y2:10,y3:14,y5:18,y10:20,y15:22,y20:18}},
    {name:"Amazon",         ticker:"AMZN", country:"🇺🇸 USA",    currency:"USD",sector:"Consumer",     color:"#f59e0b",r:{h6:14,y1:28,y2:8, y3:12,y5:14,y10:22,y15:30,y20:35}},
    {name:"Meta Platforms", ticker:"META", country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#3b82f6",r:{h6:35,y1:80,y2:16,y3:22,y5:18,y10:20,y15:null,y20:null}},
    {name:"Tesla",          ticker:"TSLA", country:"🇺🇸 USA",    currency:"USD",sector:"Auto/EV",      color:"#ef4444",r:{h6:-10,y1:28,y2:-30,y3:20,y5:40,y10:55,y15:null,y20:null}},
    {name:"Berkshire Hathaway",ticker:"BRK.B",country:"🇺🇸 USA",currency:"USD",sector:"Conglomerate", color:"#fbbf24",r:{h6:6, y1:18,y2:12,y3:14,y5:12,y10:14,y15:14,y20:12}},
    {name:"JPMorgan Chase", ticker:"JPM",  country:"🇺🇸 USA",    currency:"USD",sector:"Finance",      color:"#34d399",r:{h6:10,y1:22,y2:10,y3:18,y5:16,y10:14,y15:14,y20:10}},
    {name:"Johnson & Johnson",ticker:"JNJ",country:"🇺🇸 USA",   currency:"USD",sector:"Healthcare",   color:"#f472b6",r:{h6:-4,y1:2, y2:4, y3:4, y5:4, y10:8, y15:10,y20:10}},
    {name:"ExxonMobil",     ticker:"XOM",  country:"🇺🇸 USA",    currency:"USD",sector:"Energy",       color:"#fb923c",r:{h6:4, y1:12,y2:20,y3:18,y5:8, y10:4, y15:4, y20:2}},
    {name:"Walmart",        ticker:"WMT",  country:"🇺🇸 USA",    currency:"USD",sector:"Retail",       color:"#67e8f9",r:{h6:20,y1:38,y2:16,y3:12,y5:12,y10:12,y15:12,y20:10}},
    {name:"Visa",           ticker:"V",    country:"🇺🇸 USA",    currency:"USD",sector:"Finance",      color:"#a78bfa",r:{h6:4, y1:12,y2:4, y3:10,y5:14,y10:20,y15:22,y20:null}},
    {name:"UnitedHealth",   ticker:"UNH",  country:"🇺🇸 USA",    currency:"USD",sector:"Healthcare",   color:"#7dd3fc",r:{h6:-10,y1:-4,y2:8, y3:14,y5:16,y10:18,y15:22,y20:20}},
    {name:"Procter & Gamble",ticker:"PG",  country:"🇺🇸 USA",    currency:"USD",sector:"Consumer",     color:"#fde047",r:{h6:2, y1:8, y2:4, y3:6, y5:8, y10:10,y15:12,y20:10}},
    {name:"Mastercard",     ticker:"MA",   country:"🇺🇸 USA",    currency:"USD",sector:"Finance",      color:"#fb7185",r:{h6:2, y1:10,y2:4, y3:10,y5:14,y10:22,y15:24,y20:null}},
    {name:"Chevron",        ticker:"CVX",  country:"🇺🇸 USA",    currency:"USD",sector:"Energy",       color:"#94a3b8",r:{h6:0, y1:8, y2:14,y3:14,y5:6, y10:4, y15:4, y20:2}},
    {name:"Home Depot",     ticker:"HD",   country:"🇺🇸 USA",    currency:"USD",sector:"Retail",       color:"#fca5a5",r:{h6:2, y1:4, y2:4, y3:10,y5:14,y10:18,y15:22,y20:20}},
    {name:"AbbVie",         ticker:"ABBV", country:"🇺🇸 USA",    currency:"USD",sector:"Healthcare",   color:"#86efac",r:{h6:8, y1:18,y2:10,y3:12,y5:14,y10:16,y15:null,y20:null}},
    {name:"Pfizer",         ticker:"PFE",  country:"🇺🇸 USA",    currency:"USD",sector:"Healthcare",   color:"#34d399",r:{h6:-14,y1:-30,y2:-10,y3:4,y5:2, y10:4, y15:6, y20:4}},
    {name:"Coca-Cola",      ticker:"KO",   country:"🇺🇸 USA",    currency:"USD",sector:"Consumer",     color:"#fde68a",r:{h6:0, y1:4, y2:2, y3:4, y5:4, y10:6, y15:8, y20:8}},
    {name:"PepsiCo",        ticker:"PEP",  country:"🇺🇸 USA",    currency:"USD",sector:"Consumer",     color:"#c4b5fd",r:{h6:-4,y1:0, y2:2, y3:4, y5:6, y10:8, y15:10,y20:10}},
    {name:"Netflix",        ticker:"NFLX", country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#f97316",r:{h6:14,y1:50,y2:18,y3:22,y5:16,y10:28,y15:38,y20:null}},
    {name:"Salesforce",     ticker:"CRM",  country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#7dd3fc",r:{h6:10,y1:22,y2:0, y3:8, y5:10,y10:14,y15:20,y20:null}},
    {name:"Adobe",          ticker:"ADBE", country:"🇺🇸 USA",    currency:"USD",sector:"Technology",   color:"#f0abfc",r:{h6:4, y1:12,y2:-8,y3:6, y5:12,y10:24,y15:28,y20:null}},
    // ── Europe ──
    {name:"LVMH",           ticker:"MC",   country:"🇫🇷 France", currency:"EUR",sector:"Luxury",       color:"#fbbf24",r:{h6:-8,y1:4, y2:-10,y3:10,y5:16,y10:18,y15:20,y20:18}},
    {name:"SAP",            ticker:"SAP",  country:"🇩🇪 Germany",currency:"EUR",sector:"Technology",   color:"#60a5fa",r:{h6:10,y1:26,y2:8, y3:12,y5:12,y10:12,y15:14,y20:12}},
    {name:"ASML",           ticker:"ASML", country:"🇳🇱 Netherlands",currency:"EUR",sector:"Technology",color:"#818cf8",r:{h6:-4,y1:8,y2:-10,y3:14,y5:26,y10:28,y15:32,y20:null}},
    {name:"Nestlé",         ticker:"NESN", country:"🇨🇭 Switzerland",currency:"CHF",sector:"Consumer", color:"#059669",r:{h6:-8,y1:-4,y2:-8,y3:-2,y5:0, y10:4, y15:6, y20:8}},
    {name:"Roche",          ticker:"ROG",  country:"🇨🇭 Switzerland",currency:"CHF",sector:"Healthcare",color:"#f472b6",r:{h6:-6,y1:-8,y2:-12,y3:-4,y5:0, y10:4, y15:8, y20:10}},
    {name:"Novartis",       ticker:"NOVN", country:"🇨🇭 Switzerland",currency:"CHF",sector:"Healthcare",color:"#fb923c",r:{h6:2, y1:6, y2:2, y3:4, y5:4, y10:4, y15:6, y20:6}},
    {name:"Shell",          ticker:"SHEL", country:"🇬🇧 UK",     currency:"GBP",sector:"Energy",       color:"#fde047",r:{h6:2, y1:10,y2:12,y3:10,y5:2, y10:2, y15:2, y20:0}},
    {name:"AstraZeneca",    ticker:"AZN",  country:"🇬🇧 UK",     currency:"GBP",sector:"Healthcare",   color:"#a78bfa",r:{h6:4, y1:10,y2:8, y3:14,y5:18,y10:18,y15:20,y20:16}},
    {name:"Unilever",       ticker:"ULVR", country:"🇬🇧 UK",     currency:"GBP",sector:"Consumer",     color:"#67e8f9",r:{h6:2, y1:0, y2:-4,y3:-2,y5:0, y10:2, y15:4, y20:4}},
    {name:"Siemens",        ticker:"SIE",  country:"🇩🇪 Germany",currency:"EUR",sector:"Industrial",   color:"#7dd3fc",r:{h6:6, y1:18,y2:4, y3:14,y5:14,y10:14,y15:14,y20:10}},
    {name:"TotalEnergies",  ticker:"TTE",  country:"🇫🇷 France", currency:"EUR",sector:"Energy",       color:"#fca5a5",r:{h6:4, y1:12,y2:10,y3:8, y5:2, y10:2, y15:2, y20:2}},
    {name:"Hermes",         ticker:"RMS",  country:"🇫🇷 France", currency:"EUR",sector:"Luxury",       color:"#f59e0b",r:{h6:4, y1:22,y2:2, y3:20,y5:28,y10:30,y15:32,y20:null}},
    {name:"Airbus",         ticker:"AIR",  country:"🇫🇷 France", currency:"EUR",sector:"Aerospace",    color:"#3b82f6",r:{h6:8, y1:18,y2:4, y3:12,y5:10,y10:14,y15:16,y20:null}},
    {name:"Ferrari",        ticker:"RACE", country:"🇮🇹 Italy",  currency:"EUR",sector:"Luxury/Auto",  color:"#ef4444",r:{h6:10,y1:24,y2:6, y3:18,y5:26,y10:28,y15:null,y20:null}},
    {name:"Novo Nordisk",   ticker:"NOVO B",country:"🇩🇰 Denmark",currency:"DKK",sector:"Healthcare",  color:"#86efac",r:{h6:-10,y1:2,y2:20,y3:40,y5:50,y10:40,y15:null,y20:null}},
    {name:"LVMH",           ticker:"MC.PA",country:"🇫🇷 France", currency:"EUR",sector:"Luxury",       color:"#fbbf24",r:{h6:-8,y1:4, y2:-10,y3:10,y5:16,y10:18,y15:20,y20:18}},
    // ── Asia-Pacific ──
    {name:"Toyota",         ticker:"7203", country:"🇯🇵 Japan",  currency:"JPY",sector:"Auto",         color:"#fb923c",r:{h6:10,y1:30,y2:14,y3:22,y5:14,y10:10,y15:12,y20:8}},
    {name:"Samsung",        ticker:"005930",country:"🇰🇷 S.Korea",currency:"KRW",sector:"Technology",  color:"#60a5fa",r:{h6:0, y1:6, y2:-14,y3:4, y5:6, y10:8, y15:10,y20:12}},
    {name:"Taiwan Semi (TSMC)",ticker:"TSM",country:"🇹🇼 Taiwan",currency:"TWD",sector:"Technology",   color:"#059669",r:{h6:10,y1:30,y2:2, y3:24,y5:26,y10:24,y15:22,y20:18}},
    {name:"Sony",           ticker:"6758", country:"🇯🇵 Japan",  currency:"JPY",sector:"Technology",   color:"#818cf8",r:{h6:4, y1:10,y2:0, y3:14,y5:16,y10:14,y15:12,y20:8}},
    {name:"SoftBank",       ticker:"9984", country:"🇯🇵 Japan",  currency:"JPY",sector:"Technology",   color:"#f472b6",r:{h6:12,y1:20,y2:-10,y3:10,y5:8, y10:10,y15:12,y20:null}},
    {name:"HDFC Bank",      ticker:"HDFCBANK",country:"🇮🇳 India",currency:"INR",sector:"Finance",     color:"#4ade80",r:{h6:-2,y1:6, y2:4, y3:8, y5:14,y10:19,y15:22,y20:21}},
    {name:"Reliance Ind.",  ticker:"RELIANCE",country:"🇮🇳 India",currency:"INR",sector:"Conglomerate",color:"#f97316",r:{h6:5, y1:18,y2:22,y3:20,y5:24,y10:18,y15:22,y20:20}},
    {name:"TCS",            ticker:"TCS",  country:"🇮🇳 India",  currency:"INR",sector:"Technology",   color:"#22d3ee",r:{h6:8, y1:14,y2:18,y3:17,y5:19,y10:21,y15:24,y20:22}},
    {name:"AIA Group",      ticker:"1299", country:"🇭🇰 HK",     currency:"HKD",sector:"Finance",      color:"#a78bfa",r:{h6:-6,y1:-4,y2:-14,y3:-8,y5:-4,y10:6, y15:null,y20:null}},
    {name:"BHP",            ticker:"BHP",  country:"🇦🇺 Australia",currency:"AUD",sector:"Mining",     color:"#78716c",r:{h6:0, y1:4, y2:6, y3:10,y5:8, y10:6, y15:8, y20:6}},
    {name:"Commonwealth Bank",ticker:"CBA",country:"🇦🇺 Australia",currency:"AUD",sector:"Finance",    color:"#fde047",r:{h6:14,y1:30,y2:8, y3:14,y5:12,y10:10,y15:12,y20:10}},
    // ── China ──
    {name:"Tencent",        ticker:"0700", country:"🇨🇳 China",  currency:"HKD",sector:"Technology",   color:"#60a5fa",r:{h6:18,y1:30,y2:-20,y3:-14,y5:-4,y10:8, y15:16,y20:null}},
    {name:"Alibaba",        ticker:"9988", country:"🇨🇳 China",  currency:"HKD",sector:"Technology",   color:"#f97316",r:{h6:20,y1:14,y2:-30,y3:-24,y5:-10,y10:null,y15:null,y20:null}},
    {name:"Meituan",        ticker:"3690", country:"🇨🇳 China",  currency:"HKD",sector:"Technology",   color:"#059669",r:{h6:10,y1:20,y2:-18,y3:-10,y5:null,y10:null,y15:null,y20:null}},
    {name:"BYD",            ticker:"002594",country:"🇨🇳 China", currency:"CNY",sector:"Auto/EV",      color:"#0d9373",r:{h6:-8,y1:10,y2:-20,y3:20,y5:40,y10:30,y15:null,y20:null}},
    {name:"ICBC",           ticker:"1398", country:"🇨🇳 China",  currency:"HKD",sector:"Finance",      color:"#fbbf24",r:{h6:10,y1:20,y2:6, y3:8, y5:4, y10:2, y15:4, y20:6}},
    // ── Middle East & Others ──
    {name:"Saudi Aramco",   ticker:"2222", country:"🇸🇦 Saudi",  currency:"SAR",sector:"Energy",       color:"#f59e0b",r:{h6:0, y1:4, y2:2, y3:null,y5:null,y10:null,y15:null,y20:null}},
    {name:"SABIC",          ticker:"2010", country:"🇸🇦 Saudi",  currency:"SAR",sector:"Chemicals",    color:"#94a3b8",r:{h6:-4,y1:0, y2:2, y3:4, y5:2, y10:4, y15:6, y20:null}},
  ];

  // Remove duplicate LVMH entry
  const UNIQUE_STOCKS=STOCKS.filter((s,i,a)=>a.findIndex(x=>x.ticker===s.ticker)===i);

  const SECTORS=[...new Set(UNIQUE_STOCKS.map(s=>s.sector))].sort();
  const COUNTRIES=[...new Set(UNIQUE_STOCKS.map(s=>s.country))].sort();

  const [period,setPeriod]=React.useState("y5");
  const [sort,setSort]=React.useState("period"); // "period" | "name" | "country" | "sector"
  const [filterSector,setFilterSector]=React.useState("All");
  const [filterCountry,setFilterCountry]=React.useState("All");
  const [search,setSearch]=React.useState("");

  const filtered=useMemo(()=>{
    let data=UNIQUE_STOCKS;
    if(filterSector!=="All") data=data.filter(s=>s.sector===filterSector);
    if(filterCountry!=="All") data=data.filter(s=>s.country===filterCountry);
    if(search.trim()) data=data.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.ticker.toLowerCase().includes(search.toLowerCase()));
    return [...data].sort((a,b)=>{
      if(sort==="period") return (b.r[period]??-999)-(a.r[period]??-999);
      if(sort==="name") return a.name.localeCompare(b.name);
      if(sort==="country") return a.country.localeCompare(b.country);
      if(sort==="sector") return a.sector.localeCompare(b.sector);
      return 0;
    });
  },[filterSector,filterCountry,search,sort,period]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {MARKET_DISCLAIMER}
      <div style={{background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,padding:"10px 16px",fontSize:11,color:"#444c56"}}>
        📋 Covers ~60 major publicly listed Fortune 500 / global large-cap companies across USA, Europe, Asia-Pacific, China & Middle East.
        Returns are approximate historical CAGR in <strong style={{color:"#1f2328"}}>local currency</strong>.
        Sources: Bloomberg, Yahoo Finance, company annual reports. Illustrative estimates only.
      </div>

      {/* Controls */}
      <div className="card">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:12,alignItems:"end",flexWrap:"wrap"}}>
          {/* Search */}
          <div>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Search</div>
            <input type="text" value={search} placeholder="Name or ticker..."
              onChange={e=>setSearch(e.target.value)}
              style={{width:"100%",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,
                color:"#1f2328",padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"DM Sans,sans-serif"}}/>
          </div>
          {/* Sector filter */}
          <div>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Sector</div>
            <select value={filterSector} onChange={e=>setFilterSector(e.target.value)}
              style={{width:"100%",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,
                color:"#1f2328",padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"DM Sans,sans-serif"}}>
              <option value="All">All Sectors</option>
              {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Country filter */}
          <div>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Country</div>
            <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}
              style={{width:"100%",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:8,
                color:"#1f2328",padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"DM Sans,sans-serif"}}>
              <option value="All">All Countries</option>
              {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Result count */}
          <div style={{fontSize:11,color:"#444c56",whiteSpace:"nowrap",paddingBottom:8}}>
            {filtered.length} companies
          </div>
        </div>

        {/* Period selector */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:14,flexWrap:"wrap"}}>
          <PeriodSelector period={period} setPeriod={setPeriod} accentColor="#f59e0b"/>
          <div style={{marginLeft:"auto",display:"flex",gap:5}}>
            {[{k:"period",l:"By Return"},{k:"name",l:"By Name"},{k:"country",l:"By Country"},{k:"sector",l:"By Sector"}].map(s=>(
              <div key={s.k} onClick={()=>setSort(s.k)}
                style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,
                  background:sort===s.k?"#d0d7de":"transparent",color:sort===s.k?"#f59e0b":"#656d76",
                  border:"1px solid #d0d7de"}}>
                {s.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:820}}>
            <thead>
              <tr style={{borderBottom:"1px solid #d0d7de"}}>
                <th style={{textAlign:"left",padding:"9px 12px",color:"#444c56",fontWeight:600,fontSize:10,whiteSpace:"nowrap"}}>Company</th>
                <th style={{textAlign:"left",padding:"9px 8px",color:"#444c56",fontWeight:600,fontSize:10}}>Ticker</th>
                <th style={{textAlign:"left",padding:"9px 8px",color:"#444c56",fontWeight:600,fontSize:10}}>Country</th>
                <th style={{textAlign:"left",padding:"9px 8px",color:"#444c56",fontWeight:600,fontSize:10}}>Sector</th>
                <th style={{textAlign:"center",padding:"9px 8px",color:"#444c56",fontWeight:600,fontSize:10}}>CCY</th>
                {MARKET_PERIODS.map(p=>(
                  <th key={p.k} onClick={()=>{setPeriod(p.k);setSort("period");}}
                    style={{textAlign:"center",padding:"9px 10px",fontWeight:600,fontSize:10,whiteSpace:"nowrap",cursor:"pointer",
                      color:period===p.k?"#f59e0b":"#656d76",
                      borderBottom:period===p.k?"2px solid #f59e0b":"2px solid transparent"}}>{p.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #0d1a12",background:i%2===0?"#f6f8fa":"transparent"}}>
                  <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                      <span style={{color:s.color,fontWeight:600}}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 8px",color:"#444c56",fontSize:10,fontFamily:"Syne",fontWeight:600}}>{s.ticker}</td>
                  <td style={{padding:"9px 8px",color:"#57606a",fontSize:11,whiteSpace:"nowrap"}}>{s.country}</td>
                  <td style={{padding:"9px 8px",color:"#6b7280",fontSize:10,whiteSpace:"nowrap"}}>{s.sector}</td>
                  <td style={{padding:"9px 8px",textAlign:"center",color:"#444c56",fontSize:10,fontWeight:600}}>{s.currency}</td>
                  {MARKET_PERIODS.map(p=>{
                    const v=s.r[p.k];
                    const c=getReturnColor(v);
                    const sel=period===p.k;
                    return(
                      <td key={p.k} style={{padding:"9px 10px",textAlign:"center",background:sel?"#fffbeb":"transparent"}}>
                        {v!=null
                          ?<span style={{color:c,fontWeight:sel?700:400,fontFamily:sel?"Syne":"inherit",fontSize:sel?13:12}}>
                            {v>=0?"+":""}{v}%
                          </span>
                          :<span style={{color:"#2a3a28",fontSize:10}}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"32px",color:"#444c56",fontSize:13}}>No companies match your filters</div>
        )}
      </div>
    </div>
  );
}



const PAGES=[
  {id:"home",        label:"Home",              icon:"⌂",  desc:""},
  {id:"calculator",  label:"Lumpsum & SIP",     icon:"🧮", desc:"Lumpsum & SIP with optional step-up"},
  {id:"emi",         label:"EMI",               icon:"🏦", desc:"Loan calculator"},
  {id:"retirement",  label:"Retirement",        icon:"🌅", desc:"Plan your retirement"},
  {id:"car",         label:"Car Affordability", icon:"🚗", desc:"Can I afford this car?"},
  {id:"house",       label:"House Affordability",icon:"🏠",desc:"Buy vs Rent analysis"},
  {id:"gratuity",    label:"Gratuity",          icon:"🎁", desc:"Gratuity calculator"},
  {id:"goalseek",    label:"Goal Planner",      icon:"🎯", desc:"Plan up to 5 financial goals"},
];

// ─── GRATUITY PAGE ────────────────────────────────────────────────────────────
function GratuityPage(){
  const [lastSalary,setLastSalary]=React.useState(50000);
  const [yearsOfService,setYearsOfService]=React.useState(8);
  const [monthsOfService,setMonthsOfService]=React.useState(4);
  const [employeeType,setEmployeeType]=React.useState("covered");
  const [currentAge,setCurrentAge]=React.useState(35);
  const [retirementAge,setRetirementAge]=React.useState(60);
  const [salaryHike,setSalaryHike]=React.useState(8);

  // All calculations inline — no useMemo wrapping to avoid any render issues
  const divisor=employeeType==="covered"?26:30;
  const roundedYears=monthsOfService>=6?yearsOfService+1:yearsOfService;
  const gratuityRaw=(lastSalary*15/divisor)*roundedYears;
  const gratuity=Math.min(gratuityRaw,2000000);
  const taxExemptLimit=employeeType==="covered"?2000000:1000000;
  const taxableGratuity=Math.max(0,gratuity-taxExemptLimit);
  const monthlyAccrual=(lastSalary*15/divisor)/12;
  const isEligible=yearsOfService>=5||(yearsOfService===4&&monthsOfService>=8);
  const yearsToRetire=Math.max(1,retirementAge-currentAge);
  const projSalary=lastSalary*Math.pow(1+salaryHike/100,yearsToRetire);
  const projYears=yearsOfService+yearsToRetire;
  const projRoundedYears=monthsOfService>=6?projYears+1:projYears;
  const projGratuity=Math.min((projSalary*15/divisor)*projRoundedYears,2000000);

  // Year data — plain array built during render
  const yearData=[];
  const nYears=Math.min(Math.max(1,yearsToRetire),40);
  for(let y=1;y<=nYears;y++){
    const sal=Math.round(lastSalary*Math.pow(1+salaryHike/100,y));
    const yrs=yearsOfService+y;
    const rY=monthsOfService>=6?yrs+1:yrs;
    const g=Math.min((sal*15/divisor)*rY,2000000);
    yearData.push({age:currentAge+y,years:yrs,salary:sal,gratuity:Math.round(g)});
  }

  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:18,alignItems:"start"}}>

      {/* LEFT — Inputs */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        <div className="card" style={{borderColor:"#f59e0b30"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#f59e0b",marginBottom:14}}>Employee Details</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:7}}>Organisation Type</div>
            <PillRow options={[["covered","Covered (10+)"],["notcovered","Not Covered"]]} value={employeeType} set={setEmployeeType} activeColor="#f59e0b"/>
            <div style={{fontSize:10,color:"#444c56",marginTop:6,lineHeight:1.6}}>
              {employeeType==="covered"
                ?"Gratuity Act 1972 · Salary × 15/26 × Years · Exempt up to ₹20L"
                :"Gratuitous payment · Salary × 15/30 × Years · Exempt up to ₹10L"}
            </div>
          </div>
          <Field label="Current Age" value={currentAge} onChange={setCurrentAge} suffix=" yrs" step={1} min={18} color="#f59e0b"/>
          <Field label="Retirement Age" value={retirementAge} onChange={v=>setRetirementAge(Math.max(currentAge+1,v))} suffix=" yrs" step={1} min={currentAge+1} color="#f59e0b"/>
        </div>

        <div className="card" style={{borderColor:"#10b98130"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#0d9373",marginBottom:14}}>Salary & Service</div>
          <Field label="Last Drawn Basic + DA (monthly)" value={lastSalary} onChange={setLastSalary} prefix="₹" step={1000} min={0} color="#0d9373" hint="Basic + DA only — not HRA or bonus"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Years of Service" value={yearsOfService} onChange={setYearsOfService} suffix=" yrs" step={1} min={0} color="#0d9373"/>
            <Field label="Extra Months" value={monthsOfService} onChange={v=>setMonthsOfService(Math.min(11,Math.max(0,Math.round(v))))} suffix=" mo" step={1} min={0} color="#0d9373"/>
          </div>
          <div style={{background:"#ffffff",border:"1px solid #d0d7de",borderRadius:7,padding:"7px 11px",fontSize:11,color:"#0d9373"}}>
            {yearsOfService}y {monthsOfService}m → rounded to <strong style={{color:"#0d9373"}}>{roundedYears} years</strong>
            {monthsOfService>=6?" (≥6m rounds up)":" (<6m rounds down)"}
          </div>
        </div>

        <div className="card" style={{borderColor:"#3b82f630"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#3b82f6",marginBottom:14}}>Projection</div>
          <Field label="Expected Annual Salary Hike" value={salaryHike} onChange={setSalaryHike} suffix="%" step={0.5} min={0} color="#3b82f6"/>
        </div>

        <div className="card" style={{borderColor:"#d0d7de"}}>
          <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Formula Reference</div>
          {[
            {l:"Covered (10+ employees)",f:"Basic+DA × 15/26 × Years",c:"#0d9373",s:"Gratuity Act 1972"},
            {l:"Not Covered",f:"Basic+DA × 15/30 × Years",c:"#f59e0b",s:"Gratuitous payment"},
            {l:"Max Tax Exempt",f:"₹20,00,000 (private sector)",c:"#a78bfa",s:"Amended 2018"},
            {l:"Min Eligibility",f:"5 years continuous service",c:"#3b82f6",s:"Section 4"},
          ].map(({l,f,c,s})=>(
            <div key={l} style={{marginBottom:6,padding:"7px 10px",background:"#f6f8fa",borderRadius:7,borderLeft:`2px solid ${c}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{fontSize:10,color:c,fontWeight:600}}>{l}</span>
                <span style={{fontSize:9,color:"#444c56",background:"#d0d7de",padding:"1px 6px",borderRadius:3}}>{s}</span>
              </div>
              <div style={{fontSize:11,color:"#57606a"}}>{f}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Results */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Eligibility */}
        <div style={{background:isEligible?"#f0fdf9":"#fff0f0",border:`1px solid ${isEligible?"#0d9373":"#ef4444"}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:26}}>{isEligible?"✅":"⏳"}</div>
          <div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:isEligible?"#0d9373":"#ef4444"}}>
              {isEligible?"Eligible for Gratuity":"Not Yet Eligible"}
            </div>
            <div style={{fontSize:11,color:"#0d9373",marginTop:2}}>
              {isEligible
                ?`${yearsOfService}y ${monthsOfService}m of continuous service qualifies`
                :`Minimum 5 years required · ${Math.max(0,5-yearsOfService)} more year(s) to go`}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          {[
            {l:"Gratuity (Current)",v:formatINR(gratuity),c:"#0d9373",sub:`${roundedYears} yrs × ₹${Math.round(lastSalary*15/divisor).toLocaleString("en-IN")}`,hi:true},
            {l:"Tax Exempt",v:formatINR(Math.min(gratuity,taxExemptLimit)),c:"#059669",sub:`Limit: ${formatINR(taxExemptLimit)}`},
            {l:"Taxable Amount",v:formatINR(taxableGratuity),c:taxableGratuity>0?"#f59e0b":"#656d76",sub:taxableGratuity>0?"Added to income":"Fully exempt"},
            {l:"Monthly Accrual",v:formatINR(Math.round(monthlyAccrual)),c:"#3b82f6",sub:"Earned per month (approx)"},
            {l:"Gratuity at Retirement",v:formatINR(projGratuity),c:"#a78bfa",sub:`Age ${retirementAge} · ${projYears}y service`},
            {l:"Salary at Retirement",v:formatINR(Math.round(projSalary)),c:"#60a5fa",sub:`At ${salaryHike}% annual hike`},
          ].map(({l,v,c,sub,hi})=>(
            <div key={l} className="card" style={{borderColor:hi?c+"50":c+"20",background:hi?`linear-gradient(135deg,${c}08,#161b22)`:"#ffffff"}}>
              <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:5}}>{l}</div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(14px,1.4vw,18px)",color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#444c56",marginTop:3}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Computation */}
        <div className="card">
          <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:"#1f2328",marginBottom:12}}>Step-by-Step Computation</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {[
                {l:"Last Basic + DA (monthly)",v:formatINR(lastSalary),c:"#9ca3af"},
                {l:`Multiply: 15 ÷ ${divisor}`,v:formatINR(Math.round(lastSalary*15/divisor)),c:"#9ca3af"},
                {l:`Multiply: ${roundedYears} years`,v:formatINR(Math.round(gratuityRaw)),c:"#f59e0b",bold:true},
                {l:"Statutory cap (₹20L)",v:gratuityRaw>2000000?"Applied":"Not applicable",c:"#656d76"},
                {l:"Final Gratuity",v:formatINR(gratuity),c:"#0d9373",bold:true},
                {l:"Tax-exempt portion",v:formatINR(Math.min(gratuity,taxExemptLimit)),c:"#059669"},
                {l:"Taxable portion",v:formatINR(taxableGratuity),c:taxableGratuity>0?"#f59e0b":"#656d76"},
              ].map(({l,v,c,bold},i)=>(
                <tr key={i} style={{borderBottom:"1px solid #0d1a12",background:bold?"#ffffff":"transparent"}}>
                  <td style={{padding:"7px 10px",color:"#0d9373",fontWeight:bold?600:400}}>{l}</td>
                  <td style={{padding:"7px 10px",textAlign:"right",color:c,fontFamily:bold?"Syne":"inherit",fontWeight:bold?700:400}}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart */}
        {yearData.length>0&&(
          <div className="card">
            <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:"#1f2328",marginBottom:4}}>Gratuity Growth to Retirement</div>
            <div style={{fontSize:11,color:"#444c56",marginBottom:14}}>Projected at {salaryHike}% annual salary hike · capped at ₹20L</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={yearData} margin={{top:4,right:16,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9373" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0d9373" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
                <XAxis dataKey="age" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={<ChartTooltip labelPrefix="Age "/>}/>
                <Area type="monotone" dataKey="gratuity" name="Gratuity" stroke="#0d9373" strokeWidth={2.5} fill="url(#gg1)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Year table */}
        {yearData.length>0&&(
          <div className="card">
            <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:"#1f2328",marginBottom:12}}>Year-by-Year Projection</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:420}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #d0d7de"}}>
                    {["Age","Service","Monthly Basic+DA","Gratuity if Left Now"].map(h=>(
                      <th key={h} style={{padding:"7px 10px",textAlign:"right",color:"#444c56",fontWeight:600,fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearData.filter(row=>row.years<=6||row.years%2===0).map((row,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #0d1a12",background:row.years===5?"#f0fdf9":i%2===0?"#f6f8fa":"transparent"}}>
                      <td style={{padding:"7px 10px",textAlign:"right",color:"#1f2328"}}>{row.age}{row.years===5?" 🎯":""}</td>
                      <td style={{padding:"7px 10px",textAlign:"right",color:"#57606a"}}>{row.years}y</td>
                      <td style={{padding:"7px 10px",textAlign:"right",color:"#3b82f6",fontFamily:"Syne"}}>{formatINR(row.salary)}</td>
                      <td style={{padding:"7px 10px",textAlign:"right",color:row.years>=5?"#0d9373":"#656d76",fontFamily:"Syne",fontWeight:row.years>=5?600:400}}>
                        {row.years>=5?formatINR(row.gratuity):"Not eligible"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{fontSize:10,color:"#444c56",marginTop:6}}>🎯 = eligibility milestone at 5 years</div>
          </div>
        )}

        <div style={{padding:"10px 14px",background:"#f6f8fa",border:"1px solid #1a3020",borderRadius:8,fontSize:10,color:"#444c56",lineHeight:1.7}}>
          <strong style={{color:"#0d9373"}}>Source:</strong> Payment of Gratuity Act, 1972 (amended).
          Max tax-exempt limit ₹20L per govt. notification Mar 2018.
          Only Basic + DA used — not HRA, bonus or other allowances.
          Consult your HR or CA for precise figures.
        </div>
      </div>
    </div>
  );
}


// ─── GOAL SEEK PAGE ───────────────────────────────────────────────────────────
function GoalSeekPage(){

  const GOAL_PRESETS=[
    {name:"Child Education",  inflation:10,color:"#a78bfa"},
    {name:"House Down Payment",inflation:7, color:"#3b82f6"},
    {name:"Car",              inflation:5, color:"#f59e0b"},
    {name:"Retirement",       inflation:6, color:"#0d9373"},
    {name:"Vacation",         inflation:5, color:"#ec4899"},
    {name:"Wedding",          inflation:7, color:"#f97316"},
    {name:"Emergency Fund",   inflation:6, color:"#60a5fa"},
    {name:"Business",         inflation:6, color:"#059669"},
    {name:"Custom",           inflation:6, color:"#94a3b8"},
  ];

  const recommendedRate=(years)=>{
    if(years<=3)  return{rate:7,  label:"Conservative (Debt)",      color:"#60a5fa"};
    if(years<=5)  return{rate:10, label:"Moderate (Hybrid)",         color:"#f59e0b"};
    if(years<=7)  return{rate:12, label:"Aggressive (Equity)",       color:"#0d9373"};
    return         {rate:14, label:"Very Aggressive (Small/Mid cap)",color:"#a78bfa"};
  };

  const makeGoal=(id)=>({
    id,
    name:"Child Education",
    presentValue:1000000,
    years:10,
    inflation:10,
    returnRate:recommendedRate(10).rate,
    color:"#a78bfa",
    active:true,
  });

  const [goals,setGoals]=React.useState([makeGoal(1),makeGoal(2)]);
  const [nextId,setNextId]=React.useState(3);

  const addGoal=()=>{
    if(goals.filter(g=>g.active).length>=5) return;
    const id=nextId;
    setNextId(id+1);
    setGoals(prev=>[...prev,{...makeGoal(id),name:"New Goal",presentValue:500000,years:5,inflation:6,returnRate:10,color:"#94a3b8"}]);
  };

  const removeGoal=(id)=>setGoals(prev=>prev.filter(g=>g.id!==id));

  const updateGoal=(id,field,value)=>setGoals(prev=>prev.map(g=>{
    if(g.id!==id) return g;
    const updated={...g,[field]:value};
    if(field==="years") updated.returnRate=recommendedRate(value).rate;
    return updated;
  }));

  const activeGoals=goals.filter(g=>g.active);

  // Per-goal calculations
  const goalCalcs=activeGoals.map(g=>{
    const fv=g.presentValue*Math.pow(1+g.inflation/100,g.years);
    const mr=Math.pow(1+g.returnRate/100,1/12)-1;
    const n=g.years*12;
    const sip=mr>0?fv*mr/((Math.pow(1+mr,n)-1)*(1+mr)):fv/n;
    // Corpus build per year
    const yearData=[];
    for(let y=1;y<=g.years;y++){
      const m=y*12;
      const c=sip*(Math.pow(1+mr,m)-1)/mr*(1+mr);
      yearData.push({year:y,corpus:Math.round(c)});
    }
    const rec=recommendedRate(g.years);
    return{...g,fv:Math.round(fv),sip:Math.round(sip),yearData,rec,
      totalInvested:Math.round(sip*n),gain:Math.round(fv-sip*n)};
  });

  const totalMonthlySIP=goalCalcs.reduce((s,g)=>s+g.sip,0);
  const totalFV=goalCalcs.reduce((s,g)=>s+g.fv,0);
  const totalPV=goalCalcs.reduce((s,g)=>s+g.presentValue,0);

  // Combined timeline chart — max years across all goals
  const maxYears=Math.max(...activeGoals.map(g=>g.years),1);
  const combinedData=[];
  for(let y=1;y<=maxYears;y++){
    const row={year:y};
    goalCalcs.forEach(g=>{
      if(y<=g.years){
        const mr=Math.pow(1+g.returnRate/100,1/12)-1;
        const m=y*12;
        const c=g.sip*(Math.pow(1+mr,m)-1)/mr*(1+mr);
        row[`goal_${g.id}`]=Math.round(c);
      }
    });
    combinedData.push(row);
  }

  const COLORS=["#a78bfa","#3b82f6","#0d9373","#f59e0b","#ec4899"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Header strip */}
      <div style={{background:"linear-gradient(135deg,#0a1a10,#0d1a14)",border:"1px solid #d0d7de",borderRadius:12,padding:"16px 20px",
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:14}}>
        {[
          {l:"Goals Defined",v:`${activeGoals.length} / 5`,c:"#1f2328"},
          {l:"Total Present Value",v:formatINR(totalPV),c:"#0d9373"},
          {l:"Total Future Value",v:formatINR(totalFV),c:"#f59e0b"},
          {l:"Combined Monthly SIP",v:formatINR(totalMonthlySIP),c:"#0d9373"},
        ].map(({l,v,c})=>(
          <div key={l}>
            <div style={{fontSize:9,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>{l}</div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(15px,1.5vw,20px)",color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Goal cards */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {goalCalcs.map((g,idx)=>{
          const rec=recommendedRate(g.years);
          const isCustomRate=g.returnRate!==rec.rate;
          return(
            <div key={g.id} className="card" style={{borderColor:g.color+"40"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:12,alignItems:"start",flexWrap:"wrap"}}>

                {/* Goal name */}
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Goal {idx+1}</div>
                  <select value={g.name} onChange={e=>{
                    const preset=GOAL_PRESETS.find(p=>p.name===e.target.value)||GOAL_PRESETS[8];
                    setGoals(prev=>prev.map(pg=>pg.id===g.id?{...pg,name:e.target.value,inflation:preset.inflation,color:preset.color}:pg));
                  }} style={{width:"100%",background:"#f6f8fa",border:`1px solid ${g.color}40`,borderRadius:8,color:g.color,
                    padding:"8px 10px",fontSize:12,outline:"none",fontFamily:"DM Sans,sans-serif",fontWeight:600}}>
                    {GOAL_PRESETS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                  {g.name==="Custom"&&(
                    <input type="text" placeholder="Enter goal name"
                      style={{marginTop:6,width:"100%",background:"#f6f8fa",border:`1px solid ${g.color}40`,borderRadius:7,
                        color:"#1f2328",padding:"6px 10px",fontSize:12,outline:"none",fontFamily:"DM Sans,sans-serif"}}/>
                  )}
                </div>

                {/* Present Value */}
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>
                    Present Value
                  </div>
                  <Field label="" value={g.presentValue} onChange={v=>updateGoal(g.id,"presentValue",v)} prefix="₹" step={50000} min={0} color={g.color}/>
                </div>

                {/* Timeline */}
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>
                    Timeline
                  </div>
                  <Field label="" value={g.years} onChange={v=>updateGoal(g.id,"years",Math.max(1,v))} suffix=" yrs" step={1} min={1} color={g.color}/>
                </div>

                {/* Inflation */}
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>
                    Inflation
                  </div>
                  <Field label="" value={g.inflation} onChange={v=>updateGoal(g.id,"inflation",v)} suffix="%" step={0.5} min={0} color={g.color}/>
                </div>

                {/* Return rate */}
                <div>
                  <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:6}}>
                    Return Rate
                    {!isCustomRate&&<span style={{marginLeft:4,fontSize:8,color:rec.color,background:rec.color+"20",padding:"1px 5px",borderRadius:3}}>AUTO</span>}
                  </div>
                  <Field label="" value={g.returnRate} onChange={v=>updateGoal(g.id,"returnRate",v)} suffix="%" step={0.5} min={1} color={isCustomRate?"#f59e0b":rec.color}/>
                  <div style={{fontSize:9,color:rec.color,marginTop:3}}>{rec.label}</div>
                </div>

                {/* Remove */}
                <div style={{paddingTop:22}}>
                  {activeGoals.length>1&&(
                    <div onClick={()=>removeGoal(g.id)}
                      style={{width:28,height:28,borderRadius:6,background:"#fff0f0",border:"1px solid #ef444440",
                        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#ef4444"}}>
                      ×
                    </div>
                  )}
                </div>
              </div>

              {/* Goal result strip */}
              <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #d0d7de",
                display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                {[
                  {l:"Future Value",v:formatINR(g.fv),c:g.color},
                  {l:"Inflation Impact",v:`+${formatINR(g.fv-g.presentValue)}`,c:"#f59e0b"},
                  {l:"Monthly SIP Needed",v:formatINR(g.sip),c:"#0d9373",big:true},
                  {l:"Total to Invest",v:formatINR(g.totalInvested),c:"#9ca3af"},
                  {l:"Wealth Gain",v:formatINR(g.gain),c:"#34d399"},
                  {l:"CAGR",v:`${g.returnRate}%`,c:rec.color},
                ].map(({l,v,c,big})=>(
                  <div key={l} style={{background:"#f6f8fa",borderRadius:8,padding:"8px 12px"}}>
                    <div style={{fontSize:9,color:"#444c56",marginBottom:3,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:big?16:13,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add goal button */}
      {activeGoals.length<5&&(
        <div onClick={addGoal}
          style={{border:"2px dashed #d0d7de",borderRadius:12,padding:"16px",textAlign:"center",
            cursor:"pointer",color:"#444c56",fontSize:13,transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#0d9373";e.currentTarget.style.color="#0d9373";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#d0d7de";e.currentTarget.style.color="#656d76";}}>
          + Add Goal ({activeGoals.length}/5)
        </div>
      )}

      {/* Combined SIP summary */}
      <div className="card" style={{borderColor:"#10b98150",background:"linear-gradient(135deg,#0d1a14,#161b22)"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"#0d9373",marginBottom:16}}>Combined SIP Required</div>
        <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap",marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:6}}>Start Investing Today</div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",color:"#0d9373"}}>{formatINR(totalMonthlySIP)}</div>
            <div style={{fontSize:12,color:"#444c56",marginTop:4}}>per month across all {activeGoals.length} goals</div>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
            {goalCalcs.map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:2,background:g.color,flexShrink:0}}/>
                <div style={{fontSize:12,color:"#57606a",flex:1}}>{g.name}</div>
                <div style={{fontSize:12,color:g.color,fontFamily:"Syne",fontWeight:600,marginRight:8}}>{formatINR(g.sip)}/mo</div>
                <div style={{width:120,height:6,background:"#d0d7de",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(g.sip/totalMonthlySIP*100).toFixed(0)}%`,background:g.color,borderRadius:3}}/>
                </div>
                <div style={{fontSize:10,color:"#444c56",width:35,textAlign:"right"}}>{(g.sip/totalMonthlySIP*100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Combined corpus chart */}
      {combinedData.length>0&&(
        <div className="card">
          <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:"#1f2328",marginBottom:4}}>Corpus Building — All Goals</div>
          <div style={{fontSize:11,color:"#444c56",marginBottom:14}}>How each goal's corpus grows over time with the required SIP</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedData} margin={{top:4,right:16,left:0,bottom:0}}>
              <defs>
                {goalCalcs.map((g,i)=>(
                  <linearGradient key={g.id} id={`gcg${g.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={g.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={g.color} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de"/>
              <XAxis dataKey="year" tick={{fill:"#656d76",fontSize:10}} axisLine={false} tickLine={false} label={{value:"Years",position:"insideBottom",fill:"#656d76",fontSize:10,offset:-2}}/>
              <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:"#656d76",fontSize:9}} axisLine={false} tickLine={false} width={72}/>
              <Tooltip content={<ChartTooltip labelPrefix="Year "/>}/>
              <Legend wrapperStyle={{fontSize:11}} formatter={(val)=>{
                const g=goalCalcs.find(g=>`goal_${g.id}`===val);
                return g?g.name:val;
              }}/>
              {goalCalcs.map((g)=>(
                <Area key={g.id} type="monotone" dataKey={`goal_${g.id}`} name={`goal_${g.id}`}
                  stroke={g.color} strokeWidth={2} fill={`url(#gcg${g.id})`} connectNulls={false}/>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Goal timeline visual */}
      <div className="card">
        <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:"#1f2328",marginBottom:16}}>Goal Timeline</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {goalCalcs.sort((a,b)=>a.years-b.years).map(g=>(
            <div key={g.id} style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:12,color:g.color,fontWeight:600,width:130,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
              <div style={{flex:1,position:"relative",height:24,background:"#d0d7de",borderRadius:6,overflow:"hidden"}}>
                <div style={{position:"absolute",left:0,top:0,height:"100%",
                  width:`${(g.years/maxYears*100).toFixed(0)}%`,
                  background:`linear-gradient(90deg,${g.color}60,${g.color})`,borderRadius:6,
                  display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8}}>
                  <span style={{fontSize:10,color:"#f6f8fa",fontWeight:700,whiteSpace:"nowrap"}}>{g.years}y · {formatINR(g.fv)}</span>
                </div>
              </div>
              <div style={{fontSize:11,color:"#0d9373",fontFamily:"Syne",fontWeight:600,width:80,textAlign:"right",flexShrink:0}}>
                {formatINR(g.sip)}/mo
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:10,color:"#444c56"}}>Bar width = relative timeline · End value = future value of goal</div>
      </div>

      <div style={{padding:"10px 14px",background:"#f6f8fa",border:"1px solid #1a3020",borderRadius:8,fontSize:10,color:"#444c56",lineHeight:1.7}}>
        <strong style={{color:"#0d9373"}}>How it works:</strong> Enter the present-day cost of each goal.
        Future value is calculated using inflation over the goal's timeline.
        Monthly SIP is calculated to accumulate the future value at the recommended return rate.
        Return rates are auto-suggested based on investment horizon — longer timelines allow more equity exposure.
        Not financial advice.
      </div>
    </div>
  );
}

// ─── NET WORTH BALANCER PAGE ──────────────────────────────────────────────────
function NetWorthPage(){

  const [age,setAge]=React.useState(35);
  const [profile,setProfile]=React.useState("balanced"); // aggressive | balanced | conservative

  // ── Real Estate ──────────────────────────────────────────────────────────
  const [homeValue,setHomeValue]=React.useState(5000000);
  const [homeLoan,setHomeLoan]=React.useState(2000000);
  const [landValue,setLandValue]=React.useState(0);
  const [commercialValue,setCommercialValue]=React.useState(0);
  const [commercialLoan,setCommercialLoan]=React.useState(0);

  // ── Metals ───────────────────────────────────────────────────────────────
  const [goldValue,setGoldValue]=React.useState(300000);
  const [silverValue,setSilverValue]=React.useState(0);

  // ── Debt ─────────────────────────────────────────────────────────────────
  const [fdValue,setFdValue]=React.useState(200000);
  const [savingsBalance,setSavingsBalance]=React.useState(100000);
  const [bondsPrivate,setBondsPrivate]=React.useState(0);
  const [bondsPublic,setBondsPublic]=React.useState(0);
  const [bondsRBI,setBondsRBI]=React.useState(0);
  const [ppfPF,setPpfPF]=React.useState(500000);

  // ── Equity ───────────────────────────────────────────────────────────────
  const [mfValue,setMfValue]=React.useState(800000);
  const [stocksValue,setStocksValue]=React.useState(400000);
  const [usEquity,setUsEquity]=React.useState(0);

  // ── Asset class expected returns (historical CAGR, long-term estimates) ────
  const ASSET_RETURNS={
    equity:   {low:12,high:14,label:"Nifty 50 historical · small/mid can be higher"},
    realEstate:{low:8, high:10,label:"Tier-1 cities long-term · varies by location"},
    debt:     {low:7, high:8, label:"FD/PPF/Bonds blended · post-tax lower"},
    metals:   {low:10,high:12,label:"Gold 20Y INR CAGR · silver more volatile"},
  };

  // ── Recommended allocation — age-band + profile table ───────────────────
  // E=Equity, RE=Real Estate, D=Debt, M=Metals — all sum to 100
  const ALLOC_TABLE={
    "18-25":{ aggressive:{E:80,RE:10,D:7, M:3}, balanced:{E:70,RE:15,D:12,M:3}, conservative:{E:55,RE:20,D:22,M:3} },
    "26-35":{ aggressive:{E:75,RE:12,D:10,M:3}, balanced:{E:65,RE:18,D:14,M:3}, conservative:{E:50,RE:22,D:25,M:3} },
    "36-45":{ aggressive:{E:65,RE:18,D:13,M:4}, balanced:{E:55,RE:22,D:19,M:4}, conservative:{E:40,RE:25,D:31,M:4} },
    "46-55":{ aggressive:{E:55,RE:20,D:20,M:5}, balanced:{E:45,RE:25,D:25,M:5}, conservative:{E:30,RE:28,D:37,M:5} },
    "56-65":{ aggressive:{E:40,RE:22,D:33,M:5}, balanced:{E:30,RE:25,D:40,M:5}, conservative:{E:20,RE:25,D:50,M:5} },
    "66+":  { aggressive:{E:25,RE:20,D:50,M:5}, balanced:{E:20,RE:20,D:55,M:5}, conservative:{E:15,RE:18,D:62,M:5} },
  };

  const getAgeBand=(a)=>{
    if(a<=25) return "18-25";
    if(a<=35) return "26-35";
    if(a<=45) return "36-45";
    if(a<=55) return "46-55";
    if(a<=65) return "56-65";
    return "66+";
  };

  const recommended=React.useMemo(()=>{
    const band=getAgeBand(age);
    const alloc=ALLOC_TABLE[band][profile];
    return{
      equity:alloc.E,
      realEstate:alloc.RE,
      debt:alloc.D,
      metals:alloc.M,
    };
  },[age,profile]);

  // ── Actuals ───────────────────────────────────────────────────────────────
  const reEquity=(homeValue-homeLoan)+(landValue)+(commercialValue-commercialLoan);
  const reTotal=Math.max(0,reEquity);
  const metalsTotal=goldValue+silverValue;
  const debtTotal=fdValue+savingsBalance+bondsPrivate+bondsPublic+bondsRBI+ppfPF;
  const equityTotal=mfValue+stocksValue+usEquity;
  const grandTotal=reTotal+metalsTotal+debtTotal+equityTotal;

  const pct=(val)=>grandTotal>0?((val/grandTotal)*100).toFixed(1):0;

  // ── Blended return (actual mix) ──────────────────────────────────────────
  const blendedReturnLow=grandTotal>0?(
    (equityTotal/grandTotal)*12+
    (reTotal/grandTotal)*8+
    (debtTotal/grandTotal)*7+
    (metalsTotal/grandTotal)*10
  ).toFixed(1):0;
  const blendedReturnHigh=grandTotal>0?(
    (equityTotal/grandTotal)*14+
    (reTotal/grandTotal)*10+
    (debtTotal/grandTotal)*8+
    (metalsTotal/grandTotal)*12
  ).toFixed(1):0;

  // ── Blended return (recommended mix) ────────────────────────────────────
  const recBlendedLow=(
    (recommended.equity/100)*12+
    (recommended.realEstate/100)*8+
    (recommended.debt/100)*7+
    (recommended.metals/100)*10
  ).toFixed(1);
  const recBlendedHigh=(
    (recommended.equity/100)*14+
    (recommended.realEstate/100)*10+
    (recommended.debt/100)*8+
    (recommended.metals/100)*12
  ).toFixed(1);

  const actual={
    equity:parseFloat(pct(equityTotal)),
    realEstate:parseFloat(pct(reTotal)),
    debt:parseFloat(pct(debtTotal)),
    metals:parseFloat(pct(metalsTotal)),
  };

  // ── Traffic light ─────────────────────────────────────────────────────────
  const statusColor=(cat)=>{
    const diff=Math.abs(actual[cat]-recommended[cat]);
    if(diff<=5) return "#0d9373";
    if(diff<=15) return "#f59e0b";
    return "#ef4444";
  };
  const statusLabel=(cat)=>{
    const a=actual[cat]; const r=recommended[cat];
    const diff=Math.abs(a-r);
    if(diff<=5) return "On Track";
    return a>r?"Overweight":"Underweight";
  };

  // ── Rebalancing actions ───────────────────────────────────────────────────
  const rebalanceActions=["equity","realEstate","debt","metals"].map(cat=>{
    const diff=actual[cat]-recommended[cat];
    const amt=Math.abs(diff/100*grandTotal);
    return{cat,diff,amt,over:diff>0};
  }).filter(a=>Math.abs(a.diff)>2);

  const catMeta={
    equity:    {label:"Equity",     color:"#0d9373",icon:"📈",sub:"MF · Stocks · US Equity"},
    realEstate:{label:"Real Estate",color:"#3b82f6",icon:"🏠",sub:"Home · Land · Commercial (net of loans)"},
    debt:      {label:"Debt",       color:"#f59e0b",icon:"🏦",sub:"FD · Savings · Bonds · PPF/PF"},
    metals:    {label:"Metals",     color:"#fbbf24",icon:"🥇",sub:"Gold · Silver"},
  };

  const CATS=["equity","realEstate","debt","metals"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Asset class returns strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
        {Object.entries(ASSET_RETURNS).map(([cat,r])=>{
          const m={equity:{icon:"📈",label:"Equity",color:"#0d9373"},realEstate:{icon:"🏠",label:"Real Estate",color:"#3b82f6"},
            debt:{icon:"🏦",label:"Debt",color:"#f59e0b"},metals:{icon:"🥇",label:"Metals",color:"#fbbf24"}}[cat];
          return(
            <div key={cat} style={{background:"#ffffff",border:`1px solid ${m.color}22`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                <span style={{fontSize:16}}>{m.icon}</span>
                <span style={{fontFamily:"Syne",fontWeight:700,fontSize:12,color:m.color}}>{m.label}</span>
              </div>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:m.color}}>
                {r.low}–{r.high}%
                <span style={{fontSize:10,color:"#444c56",fontFamily:"DM Sans",fontWeight:400,marginLeft:4}}>CAGR</span>
              </div>
              <div style={{fontSize:9,color:"#444c56",marginTop:3,lineHeight:1.5}}>{r.label}</div>
            </div>
          );
        })}
      </div>

      {/* Profile inputs */}
      <div className="card" style={{borderColor:"#f59e0b30"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#f59e0b",marginBottom:14}}>Your Profile</div>
        <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:20,alignItems:"center"}}>
          <Field label="Your Age" value={age} onChange={setAge} suffix=" yrs" step={1} min={18} color="#f59e0b"/>
          <div>
            <div style={{fontSize:10,color:"#0d9373",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Risk Profile</div>
            <div style={{display:"flex",gap:10}}>
              {[
                {k:"aggressive",  label:"Aggressive",  desc:"Higher risk, higher return",  color:"#0d9373"},
                {k:"balanced",    label:"Balanced",    desc:"Moderate risk & return",       color:"#f59e0b"},
                {k:"conservative",label:"Conservative",desc:"Lower risk, capital protection",color:"#3b82f6"},
              ].map(p=>(
                <div key={p.k} onClick={()=>setProfile(p.k)}
                  style={{flex:1,padding:"12px 14px",borderRadius:10,cursor:"pointer",
                    background:profile===p.k?p.color+"18":"#f6f8fa",
                    border:`1px solid ${profile===p.k?p.color:"#d0d7de"}`,transition:"all 0.2s"}}>
                  <div style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:profile===p.k?p.color:"#6b7280",marginBottom:3}}>{p.label}</div>
                  <div style={{fontSize:10,color:"#444c56"}}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout for inputs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Real Estate */}
        <div className="card" style={{borderColor:"#3b82f630"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#3b82f6",marginBottom:4}}>🏠 Real Estate</div>
          <div style={{fontSize:11,color:"#444c56",marginBottom:14,lineHeight:1.6,background:"#eff6ff",borderRadius:6,padding:"6px 10px"}}>
            💡 Enter <strong style={{color:"#0d9373"}}>market value</strong> and outstanding loan separately.
            Net equity (market value − loan) is used for allocation.
          </div>
          <div style={{fontSize:10,color:"#3b82f6",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Home</div>
          <Field label="Market Value" value={homeValue} onChange={setHomeValue} prefix="₹" step={100000} min={0} color="#3b82f6"/>
          <Field label="Outstanding Home Loan" value={homeLoan} onChange={setHomeLoan} prefix="₹" step={100000} min={0} color="#ef4444" hint="Deducted from market value"/>
          <div style={{background:"#eff6ff",borderRadius:6,padding:"5px 10px",fontSize:11,color:"#3b82f6",marginBottom:10}}>
            Net Home Equity: <strong>{formatINR(Math.max(0,homeValue-homeLoan))}</strong>
          </div>
          <div style={{fontSize:10,color:"#3b82f6",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Land</div>
          <Field label="Land Value" value={landValue} onChange={setLandValue} prefix="₹" step={100000} min={0} color="#3b82f6"/>
          <div style={{fontSize:10,color:"#3b82f6",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8,marginTop:4}}>Commercial</div>
          <Field label="Commercial Property Value" value={commercialValue} onChange={setCommercialValue} prefix="₹" step={100000} min={0} color="#3b82f6"/>
          <Field label="Outstanding Commercial Loan" value={commercialLoan} onChange={setCommercialLoan} prefix="₹" step={100000} min={0} color="#ef4444"/>
          <div style={{background:"#eff6ff",borderRadius:6,padding:"5px 10px",fontSize:11,color:"#3b82f6",marginTop:2}}>
            Total Real Estate (net): <strong>{formatINR(reTotal)}</strong>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Metals */}
          <div className="card" style={{borderColor:"#fbbf2430"}}>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#fbbf24",marginBottom:14}}>🥇 Metals</div>
            <Field label="Gold (current market value)" value={goldValue} onChange={setGoldValue} prefix="₹" step={10000} min={0} color="#fbbf24"/>
            <Field label="Silver (current market value)" value={silverValue} onChange={setSilverValue} prefix="₹" step={5000} min={0} color="#94a3b8"/>
          </div>

          {/* Debt */}
          <div className="card" style={{borderColor:"#f59e0b30"}}>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#f59e0b",marginBottom:14}}>🏦 Debt Instruments</div>
            <Field label="Fixed Deposits / NSC" value={fdValue} onChange={setFdValue} prefix="₹" step={10000} min={0} color="#f59e0b"/>
            <Field label="Savings Account Balance" value={savingsBalance} onChange={setSavingsBalance} prefix="₹" step={10000} min={0} color="#f59e0b"/>
            <Field label="Private Bonds" value={bondsPrivate} onChange={setBondsPrivate} prefix="₹" step={10000} min={0} color="#f59e0b"/>
            <Field label="Public / Govt Bonds" value={bondsPublic} onChange={setBondsPublic} prefix="₹" step={10000} min={0} color="#f59e0b"/>
            <Field label="RBI Bonds" value={bondsRBI} onChange={setBondsRBI} prefix="₹" step={10000} min={0} color="#f59e0b"/>
            <Field label="PPF + PF (Employee + Employer)" value={ppfPF} onChange={setPpfPF} prefix="₹" step={10000} min={0} color="#f59e0b"/>
          </div>

          {/* Equity */}
          <div className="card" style={{borderColor:"#10b98130"}}>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#0d9373",marginBottom:14}}>📈 Equity</div>
            <Field label="Mutual Funds" value={mfValue} onChange={setMfValue} prefix="₹" step={10000} min={0} color="#0d9373"/>
            <Field label="Direct Stocks" value={stocksValue} onChange={setStocksValue} prefix="₹" step={10000} min={0} color="#0d9373"/>
            <Field label="US Equity / International MF" value={usEquity} onChange={setUsEquity} prefix="₹" step={10000} min={0} color="#059669"/>
          </div>
        </div>
      </div>

      {/* Net Worth total */}
      <div style={{background:"linear-gradient(135deg,#0d1a14,#0d1a14)",border:"1px solid #10b981",borderRadius:12,padding:"16px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontSize:10,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>Total Net Worth</div>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(24px,4vw,40px)",color:"#0d9373"}}>{formatINR(grandTotal)}</div>
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {CATS.map(cat=>{
            const m=catMeta[cat];
            const val=cat==="equity"?equityTotal:cat==="realEstate"?reTotal:cat==="debt"?debtTotal:metalsTotal;
            return(
              <div key={cat} style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:"#444c56",marginBottom:2}}>{m.icon} {m.label}</div>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15,color:m.color}}>{formatINR(val)}</div>
                <div style={{fontSize:10,color:"#444c56"}}>{actual[cat]}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blended return card */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[
          {label:"Your Current Blended Return",low:blendedReturnLow,high:blendedReturnHigh,
           sub:"Based on your actual asset mix",color:"#f59e0b",
           note:`${pct(equityTotal)}% Eq · ${pct(reTotal)}% RE · ${pct(debtTotal)}% Debt · ${pct(metalsTotal)}% Metals`},
          {label:"Recommended Blended Return",low:recBlendedLow,high:recBlendedHigh,
           sub:`Based on ${getAgeBand(age)} · ${profile} allocation`,color:"#0d9373",
           note:`${recommended.equity}% Eq · ${recommended.realEstate}% RE · ${recommended.debt}% Debt · ${recommended.metals}% Metals`},
        ].map(({label,low,high,sub,color,note})=>(
          <div key={label} style={{background:"linear-gradient(135deg,#0a1a10,#161b22)",
            border:`1px solid ${color}40`,borderRadius:12,padding:"16px 20px"}}>
            <div style={{fontSize:10,color:"#444c56",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:6}}>{label}</div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:28,color}}>
              {low}–{high}%
              <span style={{fontSize:11,color:"#444c56",fontFamily:"DM Sans",fontWeight:400,marginLeft:6}}>expected CAGR</span>
            </div>
            <div style={{fontSize:11,color:"#0d9373",marginTop:4}}>{sub}</div>
            <div style={{fontSize:10,color:"#444c56",marginTop:6,background:"#f6f8fa",borderRadius:6,padding:"4px 8px"}}>{note}</div>
          </div>
        ))}
      </div>

      {/* Current vs Recommended — clean table */}
      <div className="card">
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:14}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#1f2328"}}>Current vs Recommended Allocation</div>
          <div style={{fontSize:11,color:"#444c56"}}>Age {age} · {profile.charAt(0).toUpperCase()+profile.slice(1)}</div>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:"1px solid #d0d7de"}}>
              {["Asset Class","Value","Current %","Recommended %","Diff","Status"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:h==="Asset Class"?"left":"right",
                  color:"#444c56",fontWeight:600,fontSize:10,letterSpacing:"1px",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATS.map((cat,i)=>{
              const m=catMeta[cat];
              const a=actual[cat];
              const r=recommended[cat];
              const sc=statusColor(cat);
              const sl=statusLabel(cat);
              const diff=(a-r).toFixed(1);
              const val=cat==="equity"?equityTotal:cat==="realEstate"?reTotal:cat==="debt"?debtTotal:metalsTotal;
              return(
                <tr key={cat} style={{borderBottom:"1px solid #0d1a12",background:i%2===0?"#f6f8fa":"transparent"}}>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span>{m.icon}</span>
                      <div>
                        <div style={{fontWeight:600,color:m.color,fontSize:13}}>{m.label}</div>
                        <div style={{fontSize:9,color:"#444c56"}}>{m.sub}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"10px 12px",textAlign:"right",color:"#57606a",fontFamily:"Syne",fontWeight:500}}>{formatINR(val)}</td>
                  <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,fontSize:15,color:m.color}}>{a}%</td>
                  <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,fontSize:15,color:"#0d9373"}}>{r}%</td>
                  <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:600,
                    color:parseFloat(diff)===0?"#656d76":parseFloat(diff)>0?"#ef4444":"#0d9373"}}>
                    {parseFloat(diff)===0?"—":parseFloat(diff)>0?`+${diff}%`:`${diff}%`}
                  </td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}>
                    <span style={{background:sc+"20",border:`1px solid ${sc}40`,borderRadius:5,
                      padding:"3px 8px",fontSize:10,fontWeight:600,color:sc,whiteSpace:"nowrap"}}>{sl}</span>
                  </td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr style={{borderTop:"2px solid #d0d7de",background:"#ffffff"}}>
              <td style={{padding:"10px 12px",fontFamily:"Syne",fontWeight:700,color:"#1f2328"}}>Total</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,color:"#0d9373"}}>{formatINR(grandTotal)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,color:"#1f2328"}}>100%</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,color:"#0d9373"}}>100%</td>
              <td colSpan={2}/>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rebalancing actions */}
      {rebalanceActions.length>0&&(
        <div className="card" style={{borderColor:"#f59e0b30"}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#f59e0b",marginBottom:14}}>⚖️ Rebalancing Actions</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {rebalanceActions.map(({cat,diff,amt,over})=>{
              const m=catMeta[cat];
              return(
                <div key={cat} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                  background:over?"#fff0f0":"#f0fdf9",borderRadius:8,
                  border:`1px solid ${over?"#ef444430":"#10b98130"}`}}>
                  <span style={{fontSize:18}}>{m.icon}</span>
                  <div style={{flex:1}}>
                    <span style={{color:over?"#ef4444":"#0d9373",fontWeight:600,fontSize:13}}>
                      {over?"Reduce":"Increase"} {m.label}
                    </span>
                    <span style={{color:"#0d9373",fontSize:12}}> by approximately </span>
                    <span style={{color:"#1f2328",fontFamily:"Syne",fontWeight:700,fontSize:13}}>{formatINR(amt)}</span>
                  </div>
                  <div style={{fontSize:11,color:"#444c56"}}>
                    {Math.abs(diff).toFixed(1)}% off target
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:10,fontSize:10,color:"#444c56",lineHeight:1.7}}>
            💡 Rebalancing does not mean selling all assets. For equity/MF, redirect new SIPs.
            For real estate, this is a long-term view — consider liquidity before acting.
          </div>
        </div>
      )}

      {/* Portfolio Breakdown — table */}
      <div className="card">
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"#1f2328",marginBottom:14}}>Portfolio Breakdown</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:"1px solid #d0d7de"}}>
              {["Category","Instrument","Value","% of Category","% of Portfolio"].map((h,i)=>(
                <th key={h} style={{padding:"7px 12px",textAlign:i<2?"left":"right",
                  color:"#444c56",fontWeight:600,fontSize:10,letterSpacing:"1px",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {cat:"📈 Equity",     color:"#0d9373",catTotal:equityTotal,     items:[
                {l:"Mutual Funds",         v:mfValue},
                {l:"Direct Stocks",        v:stocksValue},
                {l:"US / Intl Equity",     v:usEquity},
              ]},
              {cat:"🏠 Real Estate",color:"#3b82f6",catTotal:reTotal,        items:[
                {l:"Home (net of loan)",   v:Math.max(0,homeValue-homeLoan)},
                {l:"Land",                 v:landValue},
                {l:"Commercial (net)",     v:Math.max(0,commercialValue-commercialLoan)},
              ]},
              {cat:"🏦 Debt",       color:"#f59e0b",catTotal:debtTotal,      items:[
                {l:"FD / NSC",             v:fdValue},
                {l:"Savings Balance",      v:savingsBalance},
                {l:"Private Bonds",        v:bondsPrivate},
                {l:"Public / Govt Bonds",  v:bondsPublic},
                {l:"RBI Bonds",            v:bondsRBI},
                {l:"PPF + PF",             v:ppfPF},
              ]},
              {cat:"🥇 Metals",     color:"#fbbf24",catTotal:metalsTotal,    items:[
                {l:"Gold",                 v:goldValue},
                {l:"Silver",               v:silverValue},
              ]},
            ].map(({cat,color,catTotal,items})=>{
              const activeItems=items.filter(i=>i.v>0);
              return activeItems.map((item,idx)=>(
                <tr key={cat+item.l} style={{borderBottom:"1px solid #0d1a12",
                  background:idx%2===0?"#f6f8fa":"transparent"}}>
                  {idx===0
                    ?<td rowSpan={activeItems.length} style={{padding:"8px 12px",verticalAlign:"top",
                        borderRight:"2px solid "+color+"40"}}>
                        <div style={{fontFamily:"Syne",fontWeight:700,color,fontSize:12}}>{cat}</div>
                        <div style={{fontFamily:"Syne",fontWeight:600,color,fontSize:11,marginTop:3}}>{formatINR(catTotal)}</div>
                        <div style={{fontSize:10,color:"#444c56",marginTop:1}}>{pct(catTotal)}%</div>
                      </td>
                    :null}
                  <td style={{padding:"8px 12px",color:"#57606a"}}>{item.l}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:600,color:"#1f2328"}}>{formatINR(item.v)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:"#0d9373"}}>
                    {catTotal>0?((item.v/catTotal)*100).toFixed(1):0}%
                  </td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:color}}>
                    {grandTotal>0?((item.v/grandTotal)*100).toFixed(1):0}%
                  </td>
                </tr>
              ));
            })}
            <tr style={{borderTop:"2px solid #d0d7de",background:"#ffffff"}}>
              <td colSpan={2} style={{padding:"9px 12px",fontFamily:"Syne",fontWeight:700,color:"#1f2328"}}>Total</td>
              <td style={{padding:"9px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,color:"#0d9373"}}>{formatINR(grandTotal)}</td>
              <td style={{padding:"9px 12px",textAlign:"right",color:"#444c56"}}>—</td>
              <td style={{padding:"9px 12px",textAlign:"right",fontFamily:"Syne",fontWeight:700,color:"#1f2328"}}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{padding:"10px 14px",background:"#f6f8fa",border:"1px solid #1a3020",borderRadius:8,fontSize:10,color:"#444c56",lineHeight:1.7}}>
        <strong style={{color:"#0d9373"}}>Methodology:</strong> Recommended allocation uses the 100−Age rule for equity, adjusted by risk profile.
        Real estate equity = market value − outstanding loan. PPF/PF included in Debt as fixed-return instruments.
        Recommendations are indicative — consult a financial advisor for personalised advice.
      </div>
    </div>
  );
}

export default function App(){
  const [page,setPage]=useState("home");

  return(
    <div style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"'Inter',sans-serif",color:"#1f2328"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Top Nav */}
      <div style={{background:"#ffffff",borderBottom:"1px solid #21262d",
        boxShadow:"0 4px 20px rgba(0,0,0,0.3)",padding:"14px 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {/* Logo */}
          <div style={{marginRight:20,flexShrink:0,cursor:"pointer"}} onClick={()=>setPage("home")}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:"#0d9373",letterSpacing:"-0.5px",lineHeight:1,textDecoration:"none"}}>WealthMetric</div>
            <div style={{fontSize:9,color:"#444c56",letterSpacing:"2px",textTransform:"uppercase",marginTop:2}}>Personal Finance</div>
          </div>
          {/* Nav tabs — all except home */}
          {PAGES.filter(p=>p.id!=="home").map(p=>(
            <div key={p.id} className={`nav-tab ${page===p.id?"active":"inactive"}`} onClick={()=>setPage(p.id)}>
              <span>{p.icon}</span><span>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breadcrumb — hidden on home */}
      {page!=="home"&&(
        <div style={{background:"#f6f8fa",borderBottom:"1px solid #21262d",padding:"10px 24px"}}>
          <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"#444c56",cursor:"pointer",fontWeight:500}}
              onClick={()=>setPage("home")}>Home</span>
            <span style={{color:"#d0d7de",fontSize:14}}>›</span>
            <span style={{fontSize:14,color:"#1f2328",fontFamily:"Syne",fontWeight:700}}>
              {PAGES.find(p=>p.id===page)?.icon} {PAGES.find(p=>p.id===page)?.label}
            </span>
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={{...(page!=="home"?{maxWidth:1400,margin:"0 auto",padding:"20px 16px"}:{})}}>
        {page==="home"          && <HomePage setPage={setPage}/>}
        {page==="calculator"    && <CalculatorPage/>}
        {page==="marketsip"     && <MarketSIPPage/>}
        {page==="emi"           && <EMIPage/>}
        {page==="retirement"    && <RetirementPage/>}
        {page==="car"           && <CarPage/>}
        {page==="house"         && <HousePage/>}
        {page==="globalmarkets" && <GlobalMarketsPage/>}
        {page==="globalstocks"  && <GlobalStocksPage/>}
        {page==="indiamarkets"  && <IndiaMarketsPage/>}
        {page==="percentile"    && <PercentilePage/>}
        {page==="citycosts"     && <CityCostsPage/>}
        {page==="ppp"           && <PPPPage/>}
        {page==="gratuity"      && <GratuityPage/>}
        {page==="goalseek"      && <GoalSeekPage/>}
        {page==="networth"      && <NetWorthPage/>}
      </div>
    </div>
  );
}
