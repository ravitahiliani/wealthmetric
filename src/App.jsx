import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell, AreaChart, Area
} from "recharts";

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#F7F5F0;font-family:'DM Sans',system-ui,sans-serif;color:#1A1714;-webkit-font-smoothing:antialiased}
  input[type=range]{-webkit-appearance:none;width:100%;height:4px;background:#E4E0D8;border-radius:2px;outline:none}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#C17F24;cursor:pointer;border:2.5px solid #ffffff;box-shadow:0 1px 6px rgba(193,127,36,0.4)}
  input[type=number],input[type=month],input[type=text]{background:#ffffff;border:1.5px solid #E4E0D8;border-radius:8px;color:#1A1714;padding:9px 13px;font-size:14px;width:100%;outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.15s,box-shadow 0.15s}
  input[type=number]:focus,input[type=month]:focus,input[type=text]:focus{border-color:#C17F24;box-shadow:0 0 0 3px rgba(193,127,36,0.12)}
  select{background:#ffffff;border:1.5px solid #E4E0D8;border-radius:8px;color:#1A1714;padding:9px 13px;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.15s}
  select:focus{border-color:#C17F24;box-shadow:0 0 0 3px rgba(193,127,36,0.12)}
  .card{background:#ffffff;border:1px solid #E4E0D8;border-radius:14px;padding:20px 22px;box-shadow:0 1px 3px rgba(26,23,20,0.06),0 1px 12px rgba(26,23,20,0.04);transition:box-shadow 0.2s}
  .pill{cursor:pointer;padding:6px 13px;border-radius:7px;font-size:12px;font-weight:600;transition:all 0.15s;border:1.5px solid #E4E0D8;white-space:nowrap;user-select:none;background:#ffffff;color:#5A5650}
  .pill.on{background:#C17F24;color:#ffffff;border-color:#C17F24;box-shadow:0 2px 6px rgba(193,127,36,0.3)}
  .pill.off:hover{color:#1A1714;border-color:#C17F24;background:#F5E6C8}
  .asset-pill{cursor:pointer;padding:5px 11px;border-radius:20px;font-size:12px;font-weight:600;transition:all 0.15s;border:1.5px solid transparent;white-space:nowrap;user-select:none}
  .lbl{font-size:12px;color:#5A5650;letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:10px}
  .toggle-sw{width:40px;height:22px;border-radius:11px;transition:background 0.2s;display:flex;align-items:center;padding:3px;cursor:pointer;flex-shrink:0}
  .toggle-kn{width:16px;height:16px;border-radius:50%;background:white;transition:transform 0.2s;box-shadow:0 1px 3px rgba(26,23,20,0.3)}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#F7F5F0}
  ::-webkit-scrollbar-thumb{background:#C8C3B8;border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:#8A8480}
  .nav-tab{cursor:pointer;padding:10px 20px;border-radius:10px;font-size:15px;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:8px;white-space:nowrap;user-select:none}
  .nav-tab.active{background:#C17F24;color:#ffffff;box-shadow:0 2px 8px rgba(193,127,36,0.35)}
  .nav-tab.inactive{color:#5A5650;border:1.5px solid #E4E0D8;background:#ffffff}
  .nav-tab.inactive:hover{color:#1A1714;border-color:#C17F24;background:#F5E6C8}
  .range-track{position:relative;height:6px;background:#E4E0D8;border-radius:3px;margin:8px 0}
  .range-fill{position:absolute;height:100%;background:#C17F24;border-radius:3px;pointer-events:none}
  .dual-thumb{position:absolute;width:18px;height:18px;background:#C17F24;border-radius:50%;top:50%;transform:translate(-50%,-50%);cursor:pointer;border:2px solid #ffffff;box-shadow:0 1px 6px rgba(193,127,36,0.4)}
  .stat-banner{background:#16140F;border:1px solid rgba(193,127,36,0.2);border-radius:12px;padding:16px 20px}
  .num{font-family:'DM Mono',monospace;font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
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

// accent = #C17F24 (amber-gold), accentLight = #F5E6C8
const ACC="#C17F24", ACC_L="#F5E6C8", ACC_D="#8A5A18";
const BLUE="#1D5FAA", BLUE_L="#E8F0FA";
const PURP="#6B3FA0", PURP_L="#F0EAFA";
const GREEN="#2A7A4B", GREEN_L="#EAF5EE";
const RED="#B83232";
const BORDER="#E4E0D8";
const TEXT2="#5A5650", TEXT3="#8A8480";
const BG_INV="#16140F";

function Stat({label,value,sub,color,accent}){
  return(
    <div className="card" style={accent?{borderColor:ACC+"55"}:{}}>
      <div className="lbl" style={{marginBottom:5}}>{label}</div>
      <div className="num" style={{fontWeight:700,fontSize:"clamp(16px,1.8vw,22px)",color:color||"#1A1714"}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:TEXT3,marginTop:2}}>{sub}</div>}
    </div>
  );
}

function Field({label,value,onChange,suffix="",prefix="",step=1,min=0,color,hint}){
  const [local,setLocal]=React.useState(String(value??""));
  const focused=React.useRef(false);
  React.useEffect(()=>{if(!focused.current)setLocal(String(value??""));},[value]);
  const numVal=parseFloat(local);
  const isRupee=prefix==="₹";
  let readable=null;
  if(isRupee&&!isNaN(numVal)&&numVal>=1000){
    if(numVal>=10000000)readable=`${(numVal/10000000).toFixed(2)} Cr`;
    else if(numVal>=100000)readable=`${(numVal/100000).toFixed(2)}L`;
    else readable=`${(numVal/1000).toFixed(1)}K`;
  }
  const c=color||ACC;
  return(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700}}>{label}</div>
        {readable&&<div className="num" style={{fontSize:11,color:c,fontWeight:700,background:"#ffffff",border:`1px solid ${c}33`,borderRadius:5,padding:"1px 8px"}}>{readable}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",background:"#ffffff",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden"}}>
        {prefix&&<span style={{padding:"0 10px",color:c,fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:14,borderRight:`1px solid ${BORDER}`,display:"flex",alignItems:"center",background:"#FAF8F5",alignSelf:"stretch"}}>{prefix}</span>}
        <input type="number" value={local} step={step} min={min}
          onFocus={()=>{focused.current=true;}}
          onChange={e=>{setLocal(e.target.value);const n=parseFloat(e.target.value);if(!isNaN(n))onChange(n);}}
          onBlur={e=>{focused.current=false;const n=parseFloat(e.target.value);if(isNaN(n)||e.target.value==="")setLocal(String(value??""));else{onChange(n);setLocal(String(n));}}}
          style={{flex:1,background:"transparent",border:"none",color:"#1A1714",padding:"9px 12px",fontSize:15,fontFamily:"'DM Mono',monospace",fontWeight:500,outline:"none",width:"100%"}}/>
        {suffix&&<span style={{padding:"0 12px",color:TEXT3,fontSize:12,whiteSpace:"nowrap"}}>{suffix}</span>}
      </div>
      {hint&&<div style={{fontSize:12,color:TEXT3,marginTop:5}}>{hint}</div>}
    </div>
  );
}

function Toggle({on,set,color}){
  const c=color||ACC;
  return(
    <div className="toggle-sw" style={{background:on?c:BORDER}} onClick={()=>set(p=>!p)}>
      <div className="toggle-kn" style={{transform:on?"translateX(17px)":"translateX(0)"}}/>
    </div>
  );
}

function PillRow({options,value,set,activeColor}){
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {options.map(([k,label])=>(
        <div key={k} className={`pill ${value===k?"on":"off"}`}
          style={value===k&&activeColor?{background:activeColor,borderColor:activeColor,color:"#ffffff"}:{}}
          onClick={()=>set(k)}>{label}</div>
      ))}
    </div>
  );
}

function NumInput({value,onChange,step=1,min=0,max,style={},color,suffix}){
  const [local,setLocal]=React.useState(String(value??""));
  const focused=React.useRef(false);
  React.useEffect(()=>{if(!focused.current)setLocal(String(value??""));},[value]);
  return(
    <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:7,overflow:"hidden",...(style.wrapper||{})}}>
      <input type="number" value={local} step={step} min={min} max={max}
        onFocus={()=>{focused.current=true;}}
        onChange={e=>{setLocal(e.target.value);const n=parseFloat(e.target.value);if(!isNaN(n))onChange(n);}}
        onBlur={e=>{focused.current=false;const n=parseFloat(e.target.value);if(isNaN(n)||e.target.value==="")setLocal(String(value??""));else{onChange(n);setLocal(String(n));}}}
        style={{flex:1,background:"transparent",border:"none",color:color||"#1A1714",padding:"7px 8px",fontSize:style.fontSize||14,fontFamily:"'DM Mono',monospace",fontWeight:500,outline:"none",width:"100%",minWidth:0,...(style.input||{})}}/>
      {suffix&&<span style={{padding:"0 8px",color:TEXT3,fontSize:11,whiteSpace:"nowrap"}}>{suffix}</span>}
    </div>
  );
}

function ClearableInput({value,onChange,step=1,min=0,max,color,style={},suffix,isInt=false}){
  const [local,setLocal]=React.useState(String(value??""));
  const focused=React.useRef(false);
  React.useEffect(()=>{if(!focused.current)setLocal(String(value??""));},[value]);
  return(
    <input type="number" value={local} step={step} min={min} max={max}
      onFocus={()=>{focused.current=true;}}
      onChange={e=>{setLocal(e.target.value);const n=isInt?parseInt(e.target.value):parseFloat(e.target.value);if(!isNaN(n))onChange(n);}}
      onBlur={e=>{focused.current=false;const n=isInt?parseInt(e.target.value):parseFloat(e.target.value);if(isNaN(n)||e.target.value==="")setLocal(String(value??""));else{onChange(n);setLocal(String(n));}}}
      style={{...style,color:color||"#1A1714"}}/>
  );
}

function ChartTooltip({active,payload,label,labelPrefix=""}){
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"#1A1714",border:"1px solid #3A3530",borderRadius:9,padding:"11px 15px",minWidth:190,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>
      <p style={{color:"#E4D8C8",fontWeight:700,marginBottom:6,fontSize:10,letterSpacing:"1px",textTransform:"uppercase"}}>{labelPrefix}{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||p.fill,fontSize:12,margin:"3px 0",display:"flex",justifyContent:"space-between",gap:16}}>
          <span style={{color:"#A09880"}}>{p.name}</span>
          <span className="num" style={{fontWeight:700}}>{typeof p.value==="number"?formatINR(p.value):p.value}</span>
        </p>
      ))}
    </div>
  );
}

function TipBox({children}){
  return(
    <div style={{background:"#F5E6C8",border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 11px",fontSize:10,color:ACC_D,lineHeight:1.7,marginBottom:14}}>
      {children}
    </div>
  );
}


// ─── SIP DATA ─────────────────────────────────────────────────────────────────
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
  nifty50:    {label:"Nifty 50",      short:"N50", color:ACC,  group:"index",startPrice:1528,mult:1.00,vol:0.000,drift:0.0000},
  banknifty:  {label:"Bank Nifty",    short:"BNK", color:BLUE, group:"index",startPrice:2800,mult:1.30,vol:0.008,drift:0.0005},
  midcap150:  {label:"Midcap 150",    short:"MID", color:"#F59E0B",group:"index",startPrice:2200,mult:1.20,vol:0.006,drift:0.0008},
  smallcap250:{label:"Smallcap 250",  short:"SML", color:"#EC4899",group:"index",startPrice:1800,mult:1.35,vol:0.010,drift:0.0010},
  niftyit:    {label:"Nifty IT",      short:"IT",  color:PURP, group:"index",startPrice:1100,mult:1.15,vol:0.009,drift:0.0006},
  niftypharma:{label:"Nifty Pharma",  short:"PHR", color:"#FB923C",group:"index",startPrice:1300,mult:1.10,vol:0.007,drift:0.0004},
  sp500:      {label:"S&P 500",       short:"SPX", color:"#06B6D4",group:"global",startPrice:1469,mult:0.85,vol:0.005,drift:0.0003},
  nasdaq:     {label:"Nasdaq 100",    short:"NDX", color:"#818CF8",group:"global",startPrice:3700,mult:1.05,vol:0.008,drift:0.0005},
  gold:       {label:"Gold",          short:"GLD", color:"#FBBF24",group:"commod",startPrice:4500,mult:0.55,vol:0.004,drift:0.0006},
  silver:     {label:"Silver",        short:"SLV", color:"#94A3B8",group:"commod",startPrice:8000,mult:0.65,vol:0.012,drift:0.0002},
  reliance:   {label:"Reliance",      short:"REL", color:"#F97316",group:"stock",startPrice:220, mult:1.25,vol:0.009,drift:0.0008},
  tcs:        {label:"TCS",           short:"TCS", color:"#22D3EE",group:"stock",startPrice:180, mult:1.30,vol:0.007,drift:0.0009},
  hdfcbank:   {label:"HDFC Bank",     short:"HDF", color:"#4ADE80",group:"stock",startPrice:140, mult:1.20,vol:0.008,drift:0.0007},
  infy:       {label:"Infosys",       short:"INF", color:"#C084FC",group:"stock",startPrice:160, mult:1.28,vol:0.008,drift:0.0009},
  icicibank:  {label:"ICICI Bank",    short:"ICI", color:"#F472B6",group:"stock",startPrice:90,  mult:1.35,vol:0.010,drift:0.0010},
  hindunilvr: {label:"HUL",           short:"HUL", color:GREEN,    group:"stock",startPrice:200, mult:1.10,vol:0.005,drift:0.0005},
  sbin:       {label:"SBI",           short:"SBI", color:"#7DD3FC",group:"stock",startPrice:80,  mult:1.30,vol:0.011,drift:0.0008},
  bajfinance: {label:"Bajaj Finance", short:"BAJ", color:"#FB7185",group:"stock",startPrice:120, mult:1.60,vol:0.014,drift:0.0015},
  wipro:      {label:"Wipro",         short:"WIP", color:"#A5F3FC",group:"stock",startPrice:100, mult:1.20,vol:0.008,drift:0.0007},
  titan:      {label:"Titan",         short:"TTN", color:"#F0ABFC",group:"stock",startPrice:150, mult:1.45,vol:0.010,drift:0.0012},
  fd:         {label:"Fixed Deposit", short:"FD",  color:"#64748B",group:"fixed",isFixed:true},
  bond:       {label:"Gov Bond",      short:"BND", color:"#78716C",group:"fixed",isFixed:true},
};

const GROUPS={
  index:{label:"Indian Indices",icon:"📈"},
  global:{label:"Global",icon:"🌍"},
  commod:{label:"Commodities",icon:"🥇"},
  stock:{label:"Top Stocks",icon:"🏢"},
  fixed:{label:"Fixed Returns",icon:"🏦"},
};

const SIP_FREQS={
  daily:      {label:"Daily",      perMonth:22},
  weekly:     {label:"Weekly",     perMonth:4.33},
  monthly:    {label:"Monthly",    perMonth:1},
  quarterly:  {label:"Quarterly",  perMonth:1/3},
  halfyearly: {label:"Half Yearly",perMonth:1/6},
  annually:   {label:"Annually",   perMonth:1/12},
};

const STEPUP_FREQS={
  none:      {label:"None",       everyN:0},
  monthly:   {label:"Monthly",    everyN:1},
  quarterly: {label:"Quarterly",  everyN:3},
  halfyearly:{label:"Half Yearly",everyN:6},
  annually:  {label:"Annually",   everyN:12},
};

function addMonths(yr,mo,n){const d=new Date(yr,mo-1+n,1);return{yr:d.getFullYear(),mo:d.getMonth()+1};}
function monthsBetween(sy,sm,ey,em){return(ey-sy)*12+(em-sm);}

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

function generateAssetData(key){
  const p=ASSET_PROFILES[key];
  if(p.isFixed)return null;
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

function calcFixedCorpus(sipAmount,sipFreq,stepUpFreq,stepUpType,stepUpPct,stepUpAmt,fixedRate,startYr,startMo,endYr,endMo){
  const total=monthsBetween(startYr,startMo,endYr,endMo)+1;
  const everyN=STEPUP_FREQS[stepUpFreq].everyN;
  const mr=Math.pow(1+fixedRate/100,1/12)-1;
  let corpus=0,amt=sipAmount,msSU=0;
  for(let i=0;i<total;i++){
    const{yr,mo}=addMonths(startYr,startMo,i);
    if(everyN>0&&i>0){msSU++;if(msSU>=everyN){msSU=0;amt=stepUpType==="percent"?amt*(1+stepUpPct/100):amt+stepUpAmt;}}
    let invest=false;
    if(["daily","weekly","monthly"].includes(sipFreq))invest=true;
    else if(sipFreq==="quarterly"&&mo%3===1)invest=true;
    else if(sipFreq==="halfyearly"&&mo%6===1)invest=true;
    else if(sipFreq==="annually"&&mo===1)invest=true;
    if(invest)corpus+=amt*Math.pow(1+mr,total-i-1);
  }
  return corpus;
}


// ─── CALCULATOR PAGE ──────────────────────────────────────────────────────────
function CalculatorPage(){
  const [mode,setMode]=useState("calculate");
  const [annualRate,setAnnualRate]=useState(12);
  const [years,setYears]=useState(10);
  const [lumpsum,setLumpsum]=useState(100000);
  const [sipOn,setSipOn]=useState(true);
  const [sipAmt,setSipAmt]=useState(10000);
  const [sipFreqKey,setSipFreqKey]=useState("monthly");
  const [stepPct,setStepPct]=useState(0);
  const [stepFreq,setStepFreq]=useState("annually");
  const [targetCorpus,setTargetCorpus]=useState(5000000);
  const [fsLumpsum,setFsLumpsum]=useState(100000);
  const [fsSipFreqKey,setFsSipFreqKey]=useState("monthly");
  const [fsStepPct,setFsStepPct]=useState(0);
  const [fsStepFreq,setFsStepFreq]=useState("annually");

  const rate=Number(annualRate)||0;
  const totalYears=Number(years)||0;
  const totalMonths=Math.round(totalYears*12);
  const mr=Math.pow(1+rate/100,1/12)-1;

  const calcResults=useMemo(()=>{
    if(totalMonths<1)return null;
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

  const findSipResults=useMemo(()=>{
    if(totalMonths<1||targetCorpus<=0)return null;
    const preR=mr;
    const everyN=STEPUP_FREQS[fsStepFreq]?.everyN||12;
    const freqMult=SIP_FREQS[fsSipFreqKey]?.perMonth||1;
    const lsGrowth=(Number(fsLumpsum)||0)*Math.pow(1+rate/100,totalYears);
    const sipTarget=Math.max(0,targetCorpus-lsGrowth);
    const flatSipPerPeriod=sipTarget>0&&totalMonths>0
      ?(sipTarget*preR)/((Math.pow(1+preR,totalMonths)-1)*(1+preR)/freqMult):0;
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
        if(c<sipTarget)lo=mid;else hi=mid;
      }
      stepSipPerPeriod=(lo+hi)/2;
    }
    const effectiveSip=fsStepPct>0?stepSipPerPeriod:flatSipPerPeriod;
    const effectiveSipMonthly=effectiveSip*freqMult;
    let lsC=Number(fsLumpsum)||0;
    let sipC=0,sipInv=0,sipAmt2=effectiveSipMonthly,msSU=0;
    const yearData=[];
    for(let m=1;m<=totalMonths;m++){
      lsC=lsC*(1+preR);
      if(fsStepPct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt2=sipAmt2*(1+fsStepPct/100);}}
      sipC=(sipC+sipAmt2)*(1+preR);
      sipInv+=sipAmt2;
      if(m%12===0||m===totalMonths){
        yearData.push({yr:parseFloat((m/12).toFixed(2)),lsCorpus:Math.round(lsC),sipCorpus:Math.round(sipC),
          totalCorpus:Math.round(lsC+sipC),totalInvested:Math.round((Number(fsLumpsum)||0)+sipInv),target:targetCorpus});
      }
    }
    const variants=[0,5,10,15,20].map(spct=>{
      if(spct===0)return{stepPct:spct,sipPerPeriod:flatSipPerPeriod,label:"No step-up"};
      let lo=0,hi=flatSipPerPeriod*5;
      const evN=STEPUP_FREQS[fsStepFreq]?.everyN||12;
      for(let iter=0;iter<80;iter++){
        const mid=(lo+hi)/2;
        let c=0,amt=mid*freqMult,ms=0;
        for(let m=1;m<=totalMonths;m++){
          if(m>1){ms++;if(ms>=evN){ms=0;amt=amt*(1+spct/100);}}
          c=(c+amt)*(1+preR);
        }
        if(c<sipTarget)lo=mid;else hi=mid;
      }
      return{stepPct:spct,sipPerPeriod:(lo+hi)/2,label:`${spct}% step-up`};
    });
    return{effectiveSip,effectiveSipMonthly,flatSipPerPeriod,lsGrowth,sipTarget,
      yearData,variants,freqLabel:SIP_FREQS[fsSipFreqKey]?.label||"Monthly"};
  },[targetCorpus,fsLumpsum,fsSipFreqKey,fsStepPct,fsStepFreq,rate,totalMonths,mr,totalYears]);

  const hasCalcResults=calcResults&&totalMonths>0;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* MODE TOGGLE */}
      <div style={{display:"flex",gap:0,background:"#ffffff",border:`1px solid ${BORDER}`,borderRadius:10,padding:3,alignSelf:"flex-start"}}>
        {[{k:"calculate",label:"Corpus Calculator"},{k:"findsip",label:"SIP for Target Corpus"}].map(m=>(
          <div key={m.k} onClick={()=>setMode(m.k)}
            style={{padding:"8px 24px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,
              transition:"all 0.18s",background:mode===m.k?ACC:"transparent",
              color:mode===m.k?"#ffffff":TEXT2,boxShadow:mode===m.k?"0 2px 8px rgba(193,127,36,0.25)":"none"}}>
            {m.label}
          </div>
        ))}
      </div>

      {/* ── CORPUS CALCULATOR INPUTS ── */}
      {mode==="calculate"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"stretch"}}>

          {/* LEFT: Annual Return + Time Horizon + Lumpsum */}
          <div style={{display:"grid",gridTemplateRows:"auto 1fr",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="card" style={{padding:"18px 18px"}}>
                <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Annual Return</div>
                <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
                  <ClearableInput value={annualRate} onChange={v=>setAnnualRate(v)} step={0.1} min={0} color={ACC}
                    style={{background:"transparent",border:"none",padding:0,fontSize:38,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                  <span style={{fontSize:16,color:TEXT3,fontWeight:600,flexShrink:0}}>%</span>
                </div>
                <div style={{fontSize:12,color:TEXT3,marginTop:6}}>per annum</div>
              </div>
              <div className="card" style={{padding:"18px 18px"}}>
                <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Time Horizon</div>
                <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
                  <ClearableInput value={years} onChange={v=>setYears(v)} step={0.5} min={0.5} color="#1A1714"
                    style={{background:"transparent",border:"none",padding:0,fontSize:38,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                  <span style={{fontSize:16,color:TEXT3,fontWeight:600,flexShrink:0}}>yrs</span>
                </div>
                <div style={{fontSize:12,color:TEXT3,marginTop:6}}>investment period</div>
              </div>
            </div>
            <div className="card" style={{padding:"20px 22px",borderColor:ACC+"50"}}>
              <div style={{fontSize:13,color:ACC,fontWeight:700,marginBottom:14}}>Lumpsum</div>
              <div style={{display:"flex",alignItems:"center",background:"#FFF8EE",border:`1.5px solid ${ACC}40`,borderRadius:9,overflow:"hidden"}}>
                <span style={{padding:"0 14px",color:ACC,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:18,borderRight:`1px solid ${ACC}30`,alignSelf:"stretch",display:"flex",alignItems:"center"}}>₹</span>
                <ClearableInput value={lumpsum} onChange={v=>setLumpsum(v)} step={1000} min={0} color="#1A1714"
                  style={{flex:1,background:"transparent",border:"none",padding:"13px 14px",fontSize:20,fontFamily:"'DM Mono',monospace",fontWeight:600,outline:"none"}}/>
              </div>
              <div className="num" style={{fontSize:12,color:ACC,marginTop:8,fontWeight:600}}>
                {lumpsum>=10000000?`= ₹${(lumpsum/10000000).toFixed(2)} Crore`:lumpsum>=100000?`= ₹${(lumpsum/100000).toFixed(2)} Lakh`:lumpsum>=1000?`= ₹${(lumpsum/1000).toFixed(1)}K`:""}
              </div>
            </div>
          </div>

          {/* RIGHT: SIP */}
          <div className="card" style={{padding:"22px 26px",borderColor:sipOn?BLUE+"50":BORDER}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontSize:15,color:BLUE,fontWeight:700}}>SIP</div>
              <Toggle on={sipOn} set={setSipOn} color={BLUE}/>
            </div>
            {sipOn?(<>
              <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Frequency</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
                {Object.entries(SIP_FREQS).map(([k,v])=>(
                  <div key={k} onClick={()=>setSipFreqKey(k)}
                    style={{cursor:"pointer",padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:600,
                      transition:"all 0.15s",userSelect:"none",
                      background:sipFreqKey===k?BLUE:"#FAF8F5",
                      color:sipFreqKey===k?"#ffffff":TEXT2,
                      border:`1.5px solid ${sipFreqKey===k?BLUE:BORDER}`}}>
                    {v.label}
                  </div>
                ))}
              </div>
              <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Amount</div>
              <div style={{display:"flex",alignItems:"center",background:"#EEF3FF",border:`1.5px solid ${BLUE}40`,borderRadius:9,overflow:"hidden",marginBottom:20}}>
                <span style={{padding:"0 14px",color:BLUE,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:18,borderRight:`1px solid ${BLUE}30`,alignSelf:"stretch",display:"flex",alignItems:"center"}}>₹</span>
                <ClearableInput value={sipAmt} onChange={v=>setSipAmt(v)} step={100} min={0} color="#1A1714"
                  style={{flex:1,background:"transparent",border:"none",padding:"13px 14px",fontSize:20,fontFamily:"'DM Mono',monospace",fontWeight:600,outline:"none"}}/>
                <div className="num" style={{padding:"0 14px",fontSize:12,color:BLUE,fontWeight:600,whiteSpace:"nowrap"}}>
                  {sipAmt>=100000?`${(sipAmt/100000).toFixed(2)}L`:sipAmt>=1000?`${(sipAmt/1000).toFixed(1)}K`:""}
                </div>
              </div>
              <div style={{paddingTop:16,borderTop:`1px solid ${BORDER}`}}>
                <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Step-Up</div>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{flexShrink:0}}>
                    <div style={{fontSize:12,color:TEXT3,marginBottom:6}}>Percentage</div>
                    <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden",width:90}}>
                      <ClearableInput value={stepPct} onChange={v=>setStepPct(v)} step={1} min={0} max={100} color={stepPct>0?"#F59E0B":"#1A1714"}
                        style={{flex:1,background:"transparent",border:"none",padding:"9px 10px",fontSize:18,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:0}}/>
                      <span style={{padding:"0 8px",fontSize:12,color:TEXT3}}>%</span>
                    </div>
                  </div>
                  <div style={{flex:1,opacity:stepPct>0?1:0.3,pointerEvents:stepPct>0?"auto":"none"}}>
                    <div style={{fontSize:12,color:TEXT3,marginBottom:6}}>Increase Every</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>{
                        const active=stepFreq===k&&stepPct>0;
                        return(
                          <div key={k} onClick={()=>setStepFreq(k)}
                            style={{cursor:"pointer",padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:600,
                              transition:"all 0.15s",userSelect:"none",
                              background:active?"#F59E0B":"#FAF8F5",
                              color:active?"#ffffff":TEXT2,
                              border:`1.5px solid ${active?"#F59E0B":BORDER}`}}>
                            {v.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {stepPct>0&&<div style={{marginTop:10,background:"#FFFBEB",border:"1px solid #F59E0B30",borderRadius:7,padding:"8px 12px",fontSize:12,color:"#F59E0B"}}>
                  ↑ SIP increases by {stepPct}% every {STEPUP_FREQS[stepFreq]?.label?.toLowerCase()}
                </div>}
              </div>
            </>):(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",color:TEXT3,gap:8}}>
                <div style={{fontSize:32}}>📈</div>
                <div style={{fontSize:13,fontWeight:500}}>Toggle on to add a SIP</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SIP FOR TARGET INPUTS ── */}
      {mode==="findsip"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"stretch"}}>
          <div style={{display:"grid",gridTemplateRows:"auto 1fr",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="card" style={{padding:"18px 18px"}}>
                <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Annual Return</div>
                <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
                  <ClearableInput value={annualRate} onChange={v=>setAnnualRate(v)} step={0.1} min={0} color={ACC}
                    style={{background:"transparent",border:"none",padding:0,fontSize:38,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                  <span style={{fontSize:16,color:TEXT3,fontWeight:600,flexShrink:0}}>%</span>
                </div>
                <div style={{fontSize:12,color:TEXT3,marginTop:6}}>per annum</div>
              </div>
              <div className="card" style={{padding:"18px 18px"}}>
                <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Time Horizon</div>
                <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
                  <ClearableInput value={years} onChange={v=>setYears(v)} step={0.5} min={0.5} color="#1A1714"
                    style={{background:"transparent",border:"none",padding:0,fontSize:38,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                  <span style={{fontSize:16,color:TEXT3,fontWeight:600,flexShrink:0}}>yrs</span>
                </div>
                <div style={{fontSize:12,color:TEXT3,marginTop:6}}>investment period</div>
              </div>
            </div>
            <div className="card" style={{padding:"20px 22px",borderColor:PURP+"50"}}>
              <div style={{fontSize:13,color:PURP,fontWeight:700,marginBottom:14}}>Target Corpus</div>
              <div style={{display:"flex",alignItems:"center",background:"#F5F0FF",border:`1.5px solid ${PURP}40`,borderRadius:9,overflow:"hidden"}}>
                <span style={{padding:"0 14px",color:PURP,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:18,borderRight:`1px solid ${PURP}30`,alignSelf:"stretch",display:"flex",alignItems:"center"}}>₹</span>
                <ClearableInput value={targetCorpus} onChange={v=>setTargetCorpus(v)} step={100000} min={0} color="#1A1714"
                  style={{flex:1,background:"transparent",border:"none",padding:"13px 14px",fontSize:20,fontFamily:"'DM Mono',monospace",fontWeight:600,outline:"none"}}/>
              </div>
              <div className="num" style={{fontSize:12,color:PURP,marginTop:8,fontWeight:600}}>
                {targetCorpus>=10000000?`= ₹${(targetCorpus/10000000).toFixed(2)} Crore`:targetCorpus>=100000?`= ₹${(targetCorpus/100000).toFixed(2)} Lakh`:targetCorpus>=1000?`= ₹${(targetCorpus/1000).toFixed(1)}K`:""}
              </div>
            </div>
          </div>
          <div className="card" style={{padding:"22px 26px",borderColor:ACC+"40"}}>
            <div style={{fontSize:13,color:ACC,fontWeight:700,marginBottom:14}}>Lumpsum (optional)</div>
            <div style={{display:"flex",alignItems:"center",background:"#FFF8EE",border:`1.5px solid ${ACC}40`,borderRadius:9,overflow:"hidden",marginBottom:20}}>
              <span style={{padding:"0 14px",color:ACC,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:18,borderRight:`1px solid ${ACC}30`,alignSelf:"stretch",display:"flex",alignItems:"center"}}>₹</span>
              <ClearableInput value={fsLumpsum} onChange={v=>setFsLumpsum(v)} step={1000} min={0} color="#1A1714"
                style={{flex:1,background:"transparent",border:"none",padding:"13px 14px",fontSize:20,fontFamily:"'DM Mono',monospace",fontWeight:600,outline:"none"}}/>
            </div>
            <div style={{height:1,background:BORDER,marginBottom:18}}/>
            <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>SIP Frequency</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
              {Object.entries(SIP_FREQS).map(([k,v])=>(
                <div key={k} onClick={()=>setFsSipFreqKey(k)}
                  style={{cursor:"pointer",padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:600,
                    transition:"all 0.15s",userSelect:"none",
                    background:fsSipFreqKey===k?BLUE:"#FAF8F5",
                    color:fsSipFreqKey===k?"#ffffff":TEXT2,
                    border:`1.5px solid ${fsSipFreqKey===k?BLUE:BORDER}`}}>
                  {v.label}
                </div>
              ))}
            </div>
            <div style={{paddingTop:16,borderTop:`1px solid ${BORDER}`}}>
              <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Step-Up</div>
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{flexShrink:0}}>
                  <div style={{fontSize:12,color:TEXT3,marginBottom:6}}>Percentage</div>
                  <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden",width:90}}>
                    <ClearableInput value={fsStepPct} onChange={v=>setFsStepPct(v)} step={1} min={0} max={100} color={fsStepPct>0?"#F59E0B":"#1A1714"}
                      style={{flex:1,background:"transparent",border:"none",padding:"9px 10px",fontSize:18,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:0}}/>
                    <span style={{padding:"0 8px",fontSize:12,color:TEXT3}}>%</span>
                  </div>
                </div>
                <div style={{flex:1,opacity:fsStepPct>0?1:0.3,pointerEvents:fsStepPct>0?"auto":"none"}}>
                  <div style={{fontSize:12,color:TEXT3,marginBottom:6}}>Increase Every</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>{
                      const active=fsStepFreq===k&&fsStepPct>0;
                      return(
                        <div key={k} onClick={()=>setFsStepFreq(k)}
                          style={{cursor:"pointer",padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:600,
                            transition:"all 0.15s",userSelect:"none",
                            background:active?"#F59E0B":"#FAF8F5",
                            color:active?"#ffffff":TEXT2,
                            border:`1.5px solid ${active?"#F59E0B":BORDER}`}}>
                          {v.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {fsStepPct>0&&<div style={{marginTop:10,background:"#FFFBEB",border:"1px solid #F59E0B30",borderRadius:7,padding:"8px 12px",fontSize:12,color:"#F59E0B"}}>
                ↑ SIP increases by {fsStepPct}% every {STEPUP_FREQS[fsStepFreq]?.label?.toLowerCase()}
              </div>}
            </div>
          </div>
        </div>
      )}

      {/* ── CALCULATE RESULTS ── */}
      {mode==="calculate"&&(<>
        {!hasCalcResults&&(
          <div className="card" style={{textAlign:"center",padding:"48px 20px",color:TEXT2}}>
            <div style={{fontSize:36,marginBottom:10}}>🧮</div>
            <div style={{fontWeight:700,fontSize:15}}>Enter your inputs above to see results</div>
          </div>
        )}
        {hasCalcResults&&(<>
          {/* 6 stat cards */}
          {(()=>{
            const gainColor=calcResults.total.gain>=0?GREEN:RED;
            const gainBg=calcResults.total.gain>=0?"#F4FBF7":"#FFF0F0";
            const gainBc=(calcResults.total.gain>=0?GREEN:RED)+"40";
            const gainPct=calcResults.total.invested>0?(calcResults.total.gain/calcResults.total.invested*100):0;
            return(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {l:"Total Invested",v:formatINR(calcResults.total.invested),c:TEXT2,bg:"#ffffff",bc:BORDER},
                  {l:"Total Corpus",v:formatINR(calcResults.total.corpus),c:ACC,bg:"#FFFBF2",bc:ACC+"50"},
                  {l:"Absolute Gain",v:formatINR(calcResults.total.gain),c:gainColor,bg:gainBg,bc:gainBc},
                  {l:"Gain %",v:gainPct.toFixed(1)+"%",c:gainColor,bg:gainBg,bc:gainBc},
                  {l:"Lumpsum CAGR",v:rate+"%",c:ACC,bg:"#FFFBF2",bc:ACC+"40"},
                  {l:"SIP XIRR",v:sipOn?calcResults.sip.xirr.toFixed(1)+"%":"—",c:BLUE,bg:"#F0F4FF",bc:BLUE+"40"},
                ].map(({l,v,c,bg,bc})=>(
                  <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"22px 24px"}}>
                    <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>{l}</div>
                    <div className="num" style={{fontWeight:700,fontSize:"clamp(22px,2.2vw,32px)",color:c,lineHeight:1}}>{v}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Lumpsum + SIP breakdown */}
          <div style={{display:"grid",gridTemplateColumns:sipOn?"1fr 1fr":"1fr",gap:12}}>
            <div className="card" style={{borderColor:ACC+"50"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:8,height:8,borderRadius:2,background:ACC}}/>
                  <span style={{fontSize:13,color:ACC,fontWeight:700}}>Lumpsum</span>
                </div>
                <span style={{fontSize:11,color:TEXT3}}>invested {formatINR(calcResults.ls.invested)}</span>
              </div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(22px,2.5vw,32px)",color:ACC,lineHeight:1,marginBottom:4}}>{formatINR(calcResults.ls.corpus)}</div>
              <div style={{display:"flex",gap:20,paddingTop:12,borderTop:`1px solid ${BORDER}`,marginTop:12}}>
                <div><div style={{fontSize:11,color:TEXT3,marginBottom:3}}>GAIN</div><div className="num" style={{fontWeight:700,fontSize:14,color:GREEN}}>{formatINR(calcResults.ls.gain)}</div></div>
                <div><div style={{fontSize:11,color:TEXT3,marginBottom:3}}>CAGR</div><div className="num" style={{fontWeight:700,fontSize:14,color:GREEN}}>{rate}%</div></div>
              </div>
            </div>
            {sipOn&&(
              <div className="card" style={{borderColor:BLUE+"50"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:8,height:8,borderRadius:2,background:BLUE}}/>
                    <span style={{fontSize:13,color:BLUE,fontWeight:700}}>SIP — {SIP_FREQS[sipFreqKey]?.label}</span>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {stepPct>0&&<span style={{fontSize:11,color:"#F59E0B",background:"#FFFBEB",padding:"2px 8px",borderRadius:4}}>+{stepPct}% step-up</span>}
                    <span style={{fontSize:11,color:TEXT3}}>invested {formatINR(calcResults.sip.invested)}</span>
                  </div>
                </div>
                <div className="num" style={{fontWeight:700,fontSize:"clamp(22px,2.5vw,32px)",color:BLUE,lineHeight:1,marginBottom:4}}>{formatINR(calcResults.sip.corpus)}</div>
                <div style={{display:"flex",gap:20,paddingTop:12,borderTop:`1px solid ${BORDER}`,marginTop:12}}>
                  <div><div style={{fontSize:11,color:TEXT3,marginBottom:3}}>GAIN</div><div className="num" style={{fontWeight:700,fontSize:14,color:BLUE}}>{formatINR(calcResults.sip.gain)}</div></div>
                  <div><div style={{fontSize:11,color:TEXT3,marginBottom:3}}>XIRR</div><div className="num" style={{fontWeight:700,fontSize:14,color:BLUE}}>{calcResults.sip.xirr.toFixed(1)}%</div></div>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="card">
            <div className="lbl" style={{marginBottom:14}}>Total Corpus vs Total Invested</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={calcResults.yearData} margin={{top:4,right:16,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="tcg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACC} stopOpacity={0.2}/><stop offset="95%" stopColor={ACC} stopOpacity={0}/></linearGradient>
                  <linearGradient id="tig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8A8480" stopOpacity={0.1}/><stop offset="95%" stopColor="#8A8480" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
                <XAxis dataKey="yr" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{fontSize:11}} formatter={v=>({totalCorpus:"Total Corpus",totalInvested:"Total Invested"}[v]||v)}/>
                <Area type="monotone" dataKey="totalInvested" name="Total Invested" stroke="#C8C3B8" strokeWidth={1.5} strokeDasharray="5 4" fill="url(#tig)"/>
                <Area type="monotone" dataKey="totalCorpus" name="Total Corpus" stroke={ACC} strokeWidth={2.5} fill="url(#tcg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="card">
            <div className="lbl" style={{marginBottom:12}}>Summary</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1px solid ${BORDER}`}}>
                <th style={{textAlign:"left",padding:"6px 12px",color:TEXT2,fontWeight:700,fontSize:12}}>Component</th>
                {["Invested","Corpus","Gain","Return"].map(h=>(
                  <th key={h} style={{textAlign:"right",padding:"6px 12px",color:TEXT2,fontWeight:700,fontSize:12}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  {label:"Lumpsum",color:ACC,inv:calcResults.ls.invested,corp:calcResults.ls.corpus,gain:calcResults.ls.gain,ret:rate+"%"},
                  ...(sipOn?[{label:`SIP (${SIP_FREQS[sipFreqKey]?.label}${stepPct>0?` · +${stepPct}%`:""})`,color:BLUE,inv:calcResults.sip.invested,corp:calcResults.sip.corpus,gain:calcResults.sip.gain,ret:calcResults.sip.xirr.toFixed(1)+"%"}]:[]),
                  {label:"TOTAL",color:"#1A1714",inv:calcResults.total.invested,corp:calcResults.total.corpus,gain:calcResults.total.gain,ret:(calcResults.total.invested>0?(calcResults.total.gain/calcResults.total.invested*100):0).toFixed(1)+"%",bold:true},
                ].map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid #F2F0EB`,background:row.bold?"#FAF8F5":"transparent"}}>
                    <td style={{padding:"8px 12px",color:row.color,fontWeight:row.bold?700:500,fontSize:row.bold?13:12}}>
                      {!row.bold&&<span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:row.color,marginRight:6,verticalAlign:"middle"}}/>}
                      {row.label}
                    </td>
                    <td className="num" style={{padding:"8px 12px",textAlign:"right",color:TEXT2}}>{formatINR(row.inv)}</td>
                    <td className="num" style={{padding:"8px 12px",textAlign:"right",color:row.color,fontWeight:row.bold?700:500}}>{formatINR(row.corp)}</td>
                    <td className="num" style={{padding:"8px 12px",textAlign:"right",color:GREEN}}>{formatINR(row.gain)}</td>
                    <td className="num" style={{padding:"8px 12px",textAlign:"right",color:GREEN}}>{row.ret}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}
      </>)}

      {/* ── SIP FOR TARGET RESULTS ── */}
      {mode==="findsip"&&findSipResults&&(<>
        <div style={{background:"#FFFDF9",border:`1px solid ${ACC}50`,borderRadius:14,padding:"24px 28px"}}>
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{fsSipFreqKey.charAt(0).toUpperCase()+fsSipFreqKey.slice(1)} SIP Required</div>
          <div className="num" style={{fontWeight:700,fontSize:"clamp(28px,4vw,44px)",color:PURP,lineHeight:1}}>{formatINRFull(findSipResults.effectiveSip)}</div>
          <div style={{fontSize:13,color:TEXT2,marginTop:8}}>
            to reach <strong style={{color:"#1A1714"}}>{formatINR(targetCorpus)}</strong> in <strong style={{color:ACC}}>{years} years</strong> at <strong style={{color:ACC}}>{annualRate}%</strong>
            {fsStepPct>0&&<span style={{color:"#F59E0B"}}> with {fsStepPct}% step-up</span>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[[`${findSipResults.freqLabel} SIP`,formatINRFull(findSipResults.effectiveSip),PURP,"#F5F0FF",PURP+"30"],
            ["Lumpsum Contribution",formatINR(findSipResults.lsGrowth),ACC,"#FFFDF9",ACC+"30"],
            ["SIP Contribution",formatINR(findSipResults.sipTarget),BLUE,"#F0F4FF",BLUE+"30"],
            ["Target Corpus",formatINR(targetCorpus),"#1A1714","#ffffff",BORDER],
          ].map(([l,v,c,bg,bc])=>(
            <div key={l} style={{background:bg,border:`1px solid ${bc}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:12,color:TEXT2,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.8px",fontWeight:700}}>{l}</div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(15px,1.6vw,20px)",color:c}}>{v}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="lbl" style={{marginBottom:14}}>Corpus Journey to Target</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={findSipResults.yearData} margin={{top:4,right:16,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
              <XAxis dataKey="yr" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
              <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="lsCorpus" name="Lumpsum" stroke={ACC} strokeWidth={1.5} dot={false}/>
              <Line type="monotone" dataKey="sipCorpus" name="SIP" stroke={BLUE} strokeWidth={1.5} dot={false}/>
              <Line type="monotone" dataKey="totalCorpus" name="Total" stroke={PURP} strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
              <Line type="monotone" dataKey="target" name="Target" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="lbl" style={{marginBottom:12}}>SIP at Different Step-Up Levels</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${BORDER}`}}>
              {["Step-Up","Starting SIP","vs No Step-Up","Saving"].map(h=>(
                <th key={h} style={{padding:"6px 10px",textAlign:"right",color:TEXT2,fontWeight:700,fontSize:12}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {findSipResults.variants.map((v,i)=>{
                const saving=findSipResults.variants[0].sipPerPeriod-v.sipPerPeriod;
                const isSelected=v.stepPct===fsStepPct;
                const color=v.stepPct===0?"#9CA3AF":v.stepPct<=10?GREEN:"#34D399";
                return(
                  <tr key={i} style={{borderBottom:`1px solid #F2F0EB`,background:isSelected?"#F0EAFA":"transparent",cursor:"pointer"}} onClick={()=>setFsStepPct(v.stepPct)}>
                    <td className="num" style={{padding:"8px 10px",textAlign:"right",color:PURP,fontWeight:isSelected?700:400}}>{v.label}{isSelected?" ←":""}</td>
                    <td className="num" style={{padding:"8px 10px",textAlign:"right",color,fontWeight:600}}>{formatINR(v.sipPerPeriod)}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",color:TEXT2}}>{v.stepPct===0?"—":`${((saving/findSipResults.variants[0].sipPerPeriod)*100).toFixed(0)}% lower`}</td>
                    <td className="num" style={{padding:"8px 10px",textAlign:"right",color:GREEN}}>{v.stepPct===0?"—":formatINR(saving)+"/period less"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}
      {mode==="findsip"&&!findSipResults&&(
        <div className="card" style={{textAlign:"center",padding:"48px 20px",color:TEXT2}}>
          <div style={{fontSize:36,marginBottom:10}}>🎯</div>
          <div style={{fontWeight:700,fontSize:15}}>Enter a target corpus above to calculate</div>
        </div>
      )}
    </div>
  );
}


// ─── EMI PAGE ─────────────────────────────────────────────────────────────────
function EMIPage(){
  const [loanType,setLoanType]=useState("home");
  const [principal,setPrincipal]=useState(2000000);
  const [rate,setRate]=useState(8.5);
  const [tenure,setTenure]=useState(20);

  const LOAN_TYPES={
    home:    {label:"🏠 Home",     rateHint:"7–10%",  tenureHint:"Up to 30 yrs", defaultRate:8.5, defaultTenure:20,maxTenure:30},
    car:     {label:"🚗 Car",      rateHint:"9–12%",  tenureHint:"Up to 7 yrs",  defaultRate:9.5, defaultTenure:7, maxTenure:7},
    personal:{label:"👤 Personal", rateHint:"12–20%", tenureHint:"Up to 7 yrs",  defaultRate:14.0,defaultTenure:5, maxTenure:7},
    education:{label:"🎓 Education",rateHint:"8–12%", tenureHint:"Up to 15 yrs", defaultRate:9.0, defaultTenure:10,maxTenure:15},
  };

  const handleLoanType=k=>{setLoanType(k);setRate(LOAN_TYPES[k].defaultRate);setTenure(LOAN_TYPES[k].defaultTenure);};

  const results=useMemo(()=>{
    const r=rate/(12*100);
    const n=tenure*12;
    if(r===0||n===0)return null;
    const emi=principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const totalPay=emi*n;
    const totalInt=totalPay-principal;
    const baseSchedule=[];
    let bBal=principal;
    for(let m=1;m<=n;m++){
      if(bBal<=0)break;
      const intP=bBal*r;
      const prinP=Math.min(emi-intP,bBal);
      bBal-=prinP;
      if(m%12===0||bBal<=0){
        const yr=Math.ceil(m/12);
        const prev=baseSchedule[baseSchedule.length-1];
        baseSchedule.push({year:yr,balance:Math.round(Math.max(bBal,0)),principalPaid:Math.round(principal-Math.max(bBal,0)),
          yearPrincipal:Math.round(prev?(principal-Math.max(bBal,0))-(prev.principalPaid||0):principal-Math.max(bBal,0)),
          yearInterest:Math.round(m%12===0?emi*12-(((principal-Math.max(bBal,0))-(prev?prev.principalPaid||0:0))):emi*(m%12||12)-((principal-Math.max(bBal,0))-(prev?prev.principalPaid||0:0)))});
      }
    }
    let pBal=principal,pTotInt=0,actualMonths=n,newEmi=emi;
    const prepaySchedule=[];
    for(let m=1;m<=n;m++){
      if(pBal<=0){actualMonths=m-1;break;}
      const intP=pBal*r;
      let prinP;
      if(false)prinP=Math.min(newEmi-intP,pBal);
      else prinP=Math.min(emi-intP,pBal);
      pBal-=prinP;pTotInt+=intP;

      if(m%12===0||pBal<=0){
        const yr=Math.ceil(m/12);const prev=prepaySchedule[prepaySchedule.length-1];
        prepaySchedule.push({year:yr,balance:Math.round(Math.max(pBal,0)),principalPaid:Math.round(principal-Math.max(pBal,0)),
          yearPrincipal:Math.round(prev?(principal-Math.max(pBal,0))-(prev.principalPaid||0):principal-Math.max(pBal,0)),
          yearInterest:Math.round(intP*12)});
        if(pBal<=0){actualMonths=m;break;}
      }
    }
    const intSaved=totalInt-pTotInt;
    const monthsSaved=n-actualMonths;
    const maxLen=Math.max(baseSchedule.length,prepaySchedule.length);
    const compChart=Array.from({length:maxLen},(_,i)=>({
      year:(baseSchedule[i]||prepaySchedule[i]).year,
      withoutPrepay:baseSchedule[i]?.balance??0,
      withPrepay:prepaySchedule[i]?.balance??0,
    }));
    return{emi,finalEmi:false?newEmi:emi,totalPay,totalInt,
      baseSchedule,prepaySchedule,compChart,
      intSaved:0,monthsSaved:0,actualMonths};
  },[principal,rate,tenure]);

  const schedule=results?.baseSchedule;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* ── INPUTS ROW ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>

        {/* Loan Type */}
        <div className="card" style={{padding:"20px 22px"}}>
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Loan Type</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {Object.entries(LOAN_TYPES).map(([k,v])=>(
              <div key={k} onClick={()=>handleLoanType(k)}
                style={{padding:"12px 14px",borderRadius:10,border:`1.5px solid ${loanType===k?ACC:BORDER}`,
                  background:loanType===k?ACC_L:"transparent",cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{fontSize:14,fontWeight:700,color:loanType===k?ACC_D:TEXT2,marginBottom:4}}>{v.label}</div>
                <div style={{fontSize:11,color:loanType===k?ACC_D:TEXT3}}>{v.rateHint}</div>
                <div style={{fontSize:11,color:loanType===k?ACC_D:TEXT3,marginTop:2}}>{v.tenureHint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Details */}
        <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Loan Details</div>
          <Field label="Loan Amount" value={principal} onChange={setPrincipal} prefix="₹" step={50000} min={10000} color={ACC}/>
          <Field label="Interest Rate" value={rate} onChange={setRate} suffix="% p.a." step={0.1} min={0.1} color={ACC} hint={`Typical for ${LOAN_TYPES[loanType].label}: ${LOAN_TYPES[loanType].rateHint}`}/>
          <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color={ACC} hint={`Max for ${LOAN_TYPES[loanType].label}: ${LOAN_TYPES[loanType].maxTenure}y`}/>
        </div>

        {/* Quick Summary */}
        {results&&(
          <div className="card" style={{padding:"20px 22px",borderColor:ACC+"30",background:"#FFFBF2"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Quick Summary</div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Principal vs Interest</div>
              <div style={{height:10,borderRadius:5,background:BORDER,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${(principal/results.totalPay*100).toFixed(1)}%`,background:ACC,borderRadius:5}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                <span style={{color:ACC}}>Principal {(principal/results.totalPay*100).toFixed(0)}%</span>
                <span style={{color:"#D97706"}}>Interest {(results.totalInt/results.totalPay*100).toFixed(0)}%</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:12,color:TEXT2}}>Monthly EMI</span>
                <span className="num" style={{fontWeight:700,fontSize:18,color:ACC}}>{formatINRFull(results.emi)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:12,color:TEXT2}}>Total Interest</span>
                <span className="num" style={{fontWeight:700,fontSize:16,color:"#D97706"}}>{formatINR(results.totalInt)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:12,color:TEXT2}}>Total Payment</span>
                <span className="num" style={{fontWeight:700,fontSize:16,color:TEXT2}}>{formatINR(results.totalPay)}</span>
              </div>
            </div>
          </div>
        )}
        {!results&&(
          <div className="card" style={{padding:"20px 22px",display:"flex",alignItems:"center",justifyContent:"center",color:TEXT3}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>🏦</div>
              <div style={{fontSize:13}}>Enter loan details to see results</div>
            </div>
          </div>
        )}
      </div>

      {/* ── STAT CARDS ── */}
      {results&&(<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"Principal",v:formatINR(principal),c:BLUE,bg:"#F0F4FF",bc:BLUE+"40",sub:"loan amount"},
            {l:"Monthly EMI",v:formatINRFull(results.emi),c:ACC,bg:"#FFFBF2",bc:ACC+"50",sub:null},
            {l:"Total Interest",v:formatINR(results.totalInt),c:"#D97706",bg:"#FFFBEB",bc:"#F59E0B40",sub:((results.totalInt/principal)*100).toFixed(0)+"% of principal"},
            {l:"Total Payment",v:formatINR(results.totalPay),c:TEXT2,bg:"#ffffff",bc:BORDER,sub:`over ${tenure} years`},
          ].map(({l,v,c,bg,bc,sub})=>(
            <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"20px 22px"}}>
              <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{l}</div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(20px,2vw,28px)",color:c,lineHeight:1}}>{v}</div>
              {sub&&<div style={{fontSize:12,color:TEXT3,marginTop:6}}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* Annual Principal vs Interest chart */}
          {schedule&&schedule.length>0&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:14}}>Annual Principal vs Interest Paid</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={schedule} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false}/>
                  <XAxis dataKey="year" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="yearPrincipal" name="Principal" stackId="a" fill={ACC} radius={[0,0,0,0]}/>
                  <Bar dataKey="yearInterest" name="Interest" stackId="a" fill="#F59E0B" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Amortization table */}
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div className="lbl" style={{marginBottom:0}}>Amortization Schedule</div>
            </div>
            <div style={{overflowX:"auto",maxHeight:280,overflowY:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead style={{position:"sticky",top:0,background:"#ffffff"}}>
                  <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                    {["Year","Balance","Cumulative Principal","Yr Principal","Yr Interest"].map((h,i)=>(
                      <th key={h} style={{textAlign:i===0?"left":"right",padding:"6px 10px",color:TEXT2,fontWeight:700,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule?.map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid #F2F0EB`}}>
                      <td style={{padding:"6px 10px",color:"#1A1714",fontWeight:600}}>{r.year}</td>
                      <td className="num" style={{padding:"6px 10px",color:BLUE,textAlign:"right"}}>{formatINR(r.balance)}</td>
                      <td className="num" style={{padding:"6px 10px",color:ACC,textAlign:"right"}}>{formatINR(r.principalPaid)}</td>
                      <td className="num" style={{padding:"6px 10px",color:GREEN,textAlign:"right"}}>{formatINR(r.yearPrincipal)}</td>
                      <td className="num" style={{padding:"6px 10px",color:"#F59E0B",textAlign:"right"}}>{formatINR(r.yearInterest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>)}
    </div>
  );
}


// ─── RETIREMENT PAGE (shared inputs + 3 modes) ────────────────────────────────
function RetirementSharedInputs({currentAge,setCurrentAge,lifeExp,setLifeExp,retireAge,setRetireAge,showRetireAge,currentSavings,setCurrentSavings,monthlyExpense,setMonthlyExpense,preReturnRate,setPreReturnRate,postReturnRate,setPostReturnRate,inflation,setInflation}){
  return(<>
    <div className="card">
      <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Timeline</div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${showRetireAge?3:2},1fr)`,gap:12}}>
        <div>
          <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Current Age</div>
          <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
            <ClearableInput value={currentAge} onChange={v=>setCurrentAge(v)} step={1} min={18} color={ACC} isInt={true}
              style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0}}/>
            <span style={{fontSize:14,color:TEXT3,fontWeight:600}}>yrs</span>
          </div>
        </div>
        {showRetireAge&&<div>
          <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Retire At</div>
          <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
            <ClearableInput value={retireAge} onChange={v=>setRetireAge(Math.max(currentAge+1,v))} step={1} min={currentAge+1} color={ACC} isInt={true}
              style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0}}/>
            <span style={{fontSize:14,color:TEXT3,fontWeight:600}}>yrs</span>
          </div>
        </div>}
        <div>
          <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Life Expectancy</div>
          <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px",marginTop:4}}>
            <ClearableInput value={lifeExp} onChange={v=>setLifeExp(v)} step={1} min={(retireAge||currentAge)+1} color="#1A1714" isInt={true}
              style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0}}/>
            <span style={{fontSize:14,color:TEXT3,fontWeight:600}}>yrs</span>
          </div>
        </div>
      </div>
      {showRetireAge&&(
        <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${BORDER}`,fontSize:12,color:TEXT3,display:"flex",justifyContent:"space-between"}}>
          <span>Accumulation: <strong style={{color:ACC}}>{(retireAge||0)-currentAge} years</strong></span>
          <span>Retirement: <strong style={{color:BLUE}}>{lifeExp-(retireAge||0)} years</strong></span>
        </div>
      )}
    </div>
    <div className="card">
      <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Financials</div>
      <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="₹" step={10000} min={0} color={ACC}/>
      <Field label="Monthly Expenses (today)" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={1000} min={0} color={ACC}/>
      <TipBox>💡 Include rent as a real retirement expense. If you own property counted as savings, don't double-count it.</TipBox>
    </div>
    <div className="card">
      <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Rates</div>
      <Field label="Pre-retirement Return" value={preReturnRate} onChange={setPreReturnRate} suffix="% p.a." step={0.5} min={1} color={ACC} hint="Expected return while accumulating"/>
      <Field label="Post-retirement Return" value={postReturnRate} onChange={setPostReturnRate} suffix="% p.a." step={0.5} min={1} color={BLUE} hint="Expected return during retirement"/>
      <Field label="Inflation Rate" value={inflation} onChange={setInflation} suffix="% p.a." step={0.5} min={1} color="#F59E0B"/>
    </div>
  </>);
}

function RetirementStepUp({stepPct,setStepPct,stepFreq,setStepFreq}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div>
        <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Step-Up %</div>
        <NumInput value={stepPct} onChange={v=>setStepPct(v)} step={1} min={0} max={50} suffix="%" color={stepPct>0?"#F59E0B":"#1A1714"} style={{input:{padding:"9px 10px",fontSize:15}}}/>
        <div style={{fontSize:12,color:TEXT3,marginTop:5}}>0 = no step-up</div>
      </div>
      <div>
        <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Every</div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>(
            <div key={k} onClick={()=>setStepFreq(k)}
              style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",opacity:stepPct>0?1:0.3,pointerEvents:stepPct>0?"auto":"none"}}>
              <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${stepFreq===k&&stepPct>0?"#F59E0B":BORDER}`,
                background:stepFreq===k&&stepPct>0?"#F59E0B":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {stepFreq===k&&stepPct>0&&<div style={{width:4,height:4,borderRadius:"50%",background:"#ffffff"}}/>}
              </div>
              <span style={{fontSize:11,color:stepFreq===k&&stepPct>0?"#F59E0B":TEXT2}}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RetirementPage(){
  const [mode,setMode]=useState("check");
  const [currentAge,setCurrentAge]=useState(30);
  const [lifeExp,setLifeExp]=useState(85);
  const [currentSavings,setCurrentSavings]=useState(500000);
  const [monthlyExpense,setMonthlyExpense]=useState(50000);
  const [inflation,setInflation]=useState(6);
  const [preReturnRate,setPreReturnRate]=useState(12);
  const [postReturnRate,setPostReturnRate]=useState(7);
  const [retireAge,setRetireAge]=useState(60);
  const [monthlySIP,setMonthlySIP]=useState(20000);
  const [sipStepPct,setSipStepPct]=useState(0);
  const [sipStepFreq,setSipStepFreq]=useState("annually");
  const [sipRetireAge,setSipRetireAge]=useState(60);
  const [targetCorpus,setTargetCorpus]=useState(0);
  const [sipStep2Pct,setSipStep2Pct]=useState(0);
  const [sipStep2Freq,setSipStep2Freq]=useState("annually");
  const [rwMonthlySIP,setRwMonthlySIP]=useState(20000);
  const [rwStepPct,setRwStepPct]=useState(0);
  const [rwStepFreq,setRwStepFreq]=useState("annually");

  const corpusNeededAt=(retAge)=>{
    const retireYears=lifeExp-retAge;if(retireYears<=0)return 0;
    const postR=postReturnRate/100/12,inf=inflation/100/12,yearsToRetire=retAge-currentAge;
    const expAtRetire=monthlyExpense*Math.pow(1+inflation/100,yearsToRetire);
    let needed=0;for(let m=1;m<=retireYears*12;m++)needed+=expAtRetire*Math.pow(1+inf,m-1)/Math.pow(1+postR,m);
    return needed;
  };

  const checkResult=useMemo(()=>{
    const yearsToRetire=retireAge-currentAge,retireYears=lifeExp-retireAge;
    if(yearsToRetire<=0||retireYears<=0)return null;
    const preR=preReturnRate/100/12,postR=postReturnRate/100/12,inf=inflation/100/12;
    const months=yearsToRetire*12,expAtRetire=monthlyExpense*Math.pow(1+inflation/100,yearsToRetire);
    let corpusNeeded=0;for(let m=1;m<=retireYears*12;m++)corpusNeeded+=expAtRetire*Math.pow(1+inf,m-1)/Math.pow(1+postR,m);
    const everyN=STEPUP_FREQS[sipStepFreq]?.everyN||12;
    let sipC=0,sipAmt=monthlySIP,msSU=0;
    for(let m=1;m<=months;m++){
      if(sipStepPct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt=sipAmt*(1+sipStepPct/100);}}
      sipC=(sipC+sipAmt)*(1+preR);
    }
    const savingsC=currentSavings*Math.pow(1+preR,months),totalCorpus=sipC+savingsC,surplus=totalCorpus-corpusNeeded;
    const accumData=[];let sipA2=monthlySIP,sipC2=0,msSU2=0;
    for(let m=1;m<=months;m++){
      if(sipStepPct>0&&m>1){msSU2++;if(msSU2>=everyN){msSU2=0;sipA2=sipA2*(1+sipStepPct/100);}}
      sipC2=(sipC2+sipA2)*(1+preR);
      if(m%12===0)accumData.push({age:currentAge+m/12,corpus:Math.round(sipC2+currentSavings*Math.pow(1+preR,m)),savingsCorpus:Math.round(currentSavings*Math.pow(1+preR,m)),target:Math.round(corpusNeeded*(m/months))});
    }
    let drawBal=totalCorpus;const drawData=[];
    for(let m=1;m<=retireYears*12;m++){
      drawBal=drawBal*(1+postR)-expAtRetire*Math.pow(1+inf,m-1);
      if(m%12===0)drawData.push({age:retireAge+m/12,balance:Math.round(Math.max(drawBal,0)),withdrawal:Math.round(expAtRetire*Math.pow(1+inf,m-1)*12),depleted:drawBal<0});
    }
    const depletionAge=drawData.find(d=>d.depleted)?.age||null;
    const readinessPct=Math.min((totalCorpus/corpusNeeded)*100,150);
    return{expAtRetire,corpusNeeded,totalCorpus,surplus,sipC,savingsC,accumData,drawData,yearsToRetire,retireYears,corpusSurvives:!depletionAge,depletionAge,readinessPct};
  },[currentAge,retireAge,lifeExp,currentSavings,monthlyExpense,inflation,preReturnRate,postReturnRate,monthlySIP,sipStepPct,sipStepFreq]);

  const sipNeededResult=useMemo(()=>{
    const yearsToRetire=sipRetireAge-currentAge;if(yearsToRetire<=0)return null;
    const preR=preReturnRate/100/12,months=yearsToRetire*12;
    const savingsC=currentSavings*Math.pow(1+preR,months);
    const autoCorpus=corpusNeededAt(sipRetireAge);
    const corpusTarget=targetCorpus>0?targetCorpus:autoCorpus;
    const sipTarget=Math.max(0,corpusTarget-savingsC);
    const sipNeededFlat=sipTarget>0&&months>0?(sipTarget*preR)/((Math.pow(1+preR,months)-1)*(1+preR)):0;
    const everyN=STEPUP_FREQS[sipStep2Freq]?.everyN||12;
    let sipNeededWithStep=sipNeededFlat;
    if(sipStep2Pct>0&&sipTarget>0){
      let lo=0,hi=sipNeededFlat*3;
      for(let iter=0;iter<60;iter++){
        const mid=(lo+hi)/2;let c=0,amt=mid,ms=0;
        for(let m=1;m<=months;m++){if(m>1){ms++;if(ms>=everyN){ms=0;amt=amt*(1+sipStep2Pct/100);}}c=(c+amt)*(1+preR);}
        if(c<sipTarget)lo=mid;else hi=mid;
      }
      sipNeededWithStep=(lo+hi)/2;
    }
    const effectiveSIP=sipStep2Pct>0?sipNeededWithStep:sipNeededFlat;
    const accumData=[];let sipAmt=effectiveSIP,sipC=0,msSU=0;
    for(let m=1;m<=months;m++){
      if(sipStep2Pct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt=sipAmt*(1+sipStep2Pct/100);}}
      sipC=(sipC+sipAmt)*(1+preR);
      if(m%12===0)accumData.push({age:currentAge+m/12,corpus:Math.round(sipC+currentSavings*Math.pow(1+preR,m)),target:Math.round(corpusTarget*(m/months))});
    }
    return{sipNeeded:effectiveSIP,sipNeededFlat,corpusTarget,savingsC,autoCorpus,yearsToRetire,accumData};
  },[currentAge,sipRetireAge,lifeExp,currentSavings,monthlyExpense,inflation,preReturnRate,postReturnRate,targetCorpus,sipStep2Pct,sipStep2Freq]);

  const retireWhenResult=useMemo(()=>{
    const preR=preReturnRate/100/12;const everyN=STEPUP_FREQS[rwStepFreq]?.everyN||12;
    const timeline=[];
    for(let retAge=currentAge+1;retAge<=80;retAge++){
      const months=(retAge-currentAge)*12;
      let sipC=0,sipAmt=rwMonthlySIP,msSU=0;
      for(let m=1;m<=months;m++){if(rwStepPct>0&&m>1){msSU++;if(msSU>=everyN){msSU=0;sipAmt=sipAmt*(1+rwStepPct/100);}}sipC=(sipC+sipAmt)*(1+preR);}
      const savingsC=currentSavings*Math.pow(1+preR,months),totalCorpus=sipC+savingsC;
      const needed=corpusNeededAt(retAge),pct=needed>0?totalCorpus/needed*100:100;
      timeline.push({age:retAge,corpus:Math.round(totalCorpus),needed:Math.round(needed),pct:Math.round(pct),surplus:Math.round(totalCorpus-needed),canRetire:totalCorpus>=needed});
    }
    return{timeline,earliest:timeline.find(t=>t.canRetire),comfortable:timeline.find(t=>t.pct>=120)};
  },[currentAge,lifeExp,currentSavings,monthlyExpense,inflation,preReturnRate,postReturnRate,rwMonthlySIP,rwStepPct,rwStepFreq]);

  const pct=checkResult?.readinessPct||0;
  const gaugeColor=pct>=100?GREEN:pct>=70?"#F59E0B":RED;
  const R=54,CX=70,CY=70,toRad=d=>d*Math.PI/180;
  const arcAngle=Math.min(pct/100,1)*180;
  const arcX=CX+R*Math.cos(toRad(180-arcAngle));
  const arcY=CY-R*Math.sin(toRad(180-arcAngle));
  const largeArc=arcAngle>180?1:0;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* MODE TABS */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{k:"check",label:"Plan Check",desc:"How am I tracking?"},{k:"sipneeded",label:"SIP Needed",desc:"What SIP do I need?"},{k:"retirewhen",label:"Retire When",desc:"When can I retire?"}].map(m=>(
          <div key={m.k} onClick={()=>setMode(m.k)}
            style={{padding:"14px 28px",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",gap:3,
              minWidth:160,transition:"all 0.2s",
              background:mode===m.k?ACC:"#ffffff",color:mode===m.k?"#ffffff":TEXT2,
              border:`1.5px solid ${mode===m.k?ACC:BORDER}`,
              boxShadow:mode===m.k?"0 2px 10px rgba(193,127,36,0.25)":"none"}}>
            <div style={{fontWeight:700,fontSize:15}}>{m.label}</div>
            <div style={{fontSize:12,opacity:0.75}}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* ══ PLAN CHECK ══ */}
      {mode==="check"&&(<>
        {/* INPUTS ROW */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* LEFT: Timeline + Financials */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="card" style={{padding:"20px 22px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Timeline</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {label:"Current Age",val:currentAge,set:setCurrentAge,color:ACC},
                  {label:"Retire At",val:retireAge,set:v=>setRetireAge(Math.max(currentAge+1,v)),color:ACC},
                  {label:"Life Expectancy",val:lifeExp,set:setLifeExp,color:"#1A1714"},
                ].map(({label,val,set,color})=>(
                  <div key={label}>
                    <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{label}</div>
                    <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px"}}>
                      <ClearableInput value={val} onChange={set} step={1} min={18} color={color} isInt={true}
                        style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                      <span style={{fontSize:13,color:TEXT3,flexShrink:0,marginLeft:4}}>yrs</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${BORDER}`,fontSize:12,color:TEXT3,display:"flex",justifyContent:"space-between"}}>
                <span>Accumulation: <strong style={{color:ACC}}>{retireAge-currentAge} yrs</strong></span>
                <span>Retirement: <strong style={{color:BLUE}}>{lifeExp-retireAge} yrs</strong></span>
              </div>
            </div>
            <div className="card" style={{padding:"20px 22px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Financials</div>
              <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="₹" step={10000} min={0} color={ACC}/>
              <Field label="Monthly Expenses (today)" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={1000} min={0} color={ACC}/>
            </div>
          </div>
          {/* RIGHT: Rates & SIP */}
          <div className="card" style={{padding:"22px 24px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Rates & SIP</div>
            <Field label="Pre-retirement Return" value={preReturnRate} onChange={setPreReturnRate} suffix="% p.a." step={0.5} min={1} color={ACC}/>
            <Field label="Post-retirement Return" value={postReturnRate} onChange={setPostReturnRate} suffix="% p.a." step={0.5} min={1} color={BLUE}/>
            <Field label="Inflation" value={inflation} onChange={setInflation} suffix="% p.a." step={0.5} min={1} color="#F59E0B"/>
            <div style={{height:1,background:BORDER,margin:"8px 0 14px"}}/>
            <Field label="Monthly SIP" value={monthlySIP} onChange={setMonthlySIP} prefix="₹" step={500} min={0} color={ACC}/>
            <div style={{display:"flex",gap:14,alignItems:"flex-start",marginTop:8}}>
              <div style={{width:110,flexShrink:0}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Step-Up %</div>
                <NumInput value={sipStepPct} onChange={v=>setSipStepPct(v)} step={1} min={0} max={50} suffix="%" color={sipStepPct>0?"#F59E0B":"#1A1714"} style={{input:{padding:"8px 10px",fontSize:15}}}/>
                <div style={{fontSize:11,color:TEXT3,marginTop:4}}>0 = none</div>
              </div>
              <div style={{flex:1,opacity:sipStepPct>0?1:0.3,pointerEvents:sipStepPct>0?"auto":"none"}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Increase Every</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>{
                    const active=sipStepFreq===k&&sipStepPct>0;
                    return <div key={k} onClick={()=>setSipStepFreq(k)}
                      style={{cursor:"pointer",padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,
                        background:active?"#F59E0B":"#FAF8F5",color:active?"#ffffff":TEXT2,border:`1.5px solid ${active?"#F59E0B":BORDER}`}}>{v.label}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {checkResult&&(<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[
              {l:"Corpus Needed",v:formatINR(checkResult.corpusNeeded),c:"#D97706",bg:"#FFFBEB",bc:"#F59E0B40",sub:"at retirement"},
              {l:"Corpus You'll Build",v:formatINR(checkResult.totalCorpus),c:ACC,bg:"#FFFBF2",bc:ACC+"50",sub:"at retirement"},
              {l:checkResult.surplus>=0?"Surplus":"Shortfall",v:formatINR(Math.abs(checkResult.surplus)),c:checkResult.surplus>=0?GREEN:RED,bg:checkResult.surplus>=0?"#EAF5EE":"#FDEAEA",bc:(checkResult.surplus>=0?GREEN:RED)+"40",sub:null},
              {l:"Monthly Exp. at Retirement",v:formatINR(checkResult.expAtRetire),c:TEXT2,bg:"#ffffff",bc:BORDER,sub:"inflation adjusted"},
            ].map(({l,v,c,bg,bc,sub})=>(
              <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"20px 22px"}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{l}</div>
                <div className="num" style={{fontWeight:700,fontSize:"clamp(18px,1.8vw,24px)",color:c,lineHeight:1}}>{v}</div>
                {sub&&<div style={{fontSize:12,color:TEXT3,marginTop:6}}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Readiness + Survivability */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="card" style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"24px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14,alignSelf:"flex-start"}}>Retirement Readiness</div>
              <svg width="160" height="90" viewBox="0 0 140 80">
                <path d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`} fill="none" stroke={BORDER} strokeWidth="12" strokeLinecap="round"/>
                {pct>0&&<path d={`M ${CX-R} ${CY} A ${R} ${R} 0 ${largeArc} 1 ${arcX} ${arcY}`} fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round"/>}
                <text x={CX} y={CY+4} textAnchor="middle" fill={gaugeColor} fontSize="18" fontFamily="'DM Mono',monospace" fontWeight="700">{Math.min(Math.round(pct),150)}%</text>
                <text x={CX} y={CY+18} textAnchor="middle" fill={TEXT3} fontSize="8">of target</text>
              </svg>
              <div style={{fontSize:14,fontWeight:700,color:gaugeColor,marginTop:4}}>{pct>=100?"On Track ✓":pct>=70?"Almost There":"Needs Attention"}</div>
            </div>
            <div className="card" style={{padding:"24px",background:checkResult.corpusSurvives?"#F4FBF7":"#FFF0F0",borderColor:checkResult.corpusSurvives?GREEN+"50":RED+"50"}}>
              <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Corpus Survivability</div>
              {checkResult.corpusSurvives?(
                <>
                  <div style={{fontWeight:700,fontSize:22,color:GREEN,marginBottom:8}}>✓ Lasts till age {lifeExp}</div>
                  <div style={{fontSize:13,color:TEXT2,marginBottom:4}}>Balance remaining</div>
                  <div className="num" style={{fontWeight:700,fontSize:20,color:GREEN}}>{formatINR(checkResult.drawData[checkResult.drawData.length-1]?.balance||0)}</div>
                </>
              ):(
                <>
                  <div style={{fontWeight:700,fontSize:22,color:RED,marginBottom:8}}>⚠ Depletes at age {checkResult.depletionAge}</div>
                  <div style={{fontSize:13,color:TEXT2,marginBottom:4}}>Years short</div>
                  <div className="num" style={{fontWeight:700,fontSize:20,color:"#F59E0B"}}>{lifeExp-(checkResult.depletionAge||lifeExp)} years before expectancy</div>
                </>
              )}
            </div>
          </div>

          {/* Charts */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="card">
              <div className="lbl" style={{marginBottom:14}}>Corpus Building Journey</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={checkResult.accumData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACC} stopOpacity={0.25}/><stop offset="95%" stopColor={ACC} stopOpacity={0}/></linearGradient>
                    <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BLUE} stopOpacity={0.15}/><stop offset="95%" stopColor={BLUE} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
                  <XAxis dataKey="age" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Area type="monotone" dataKey="savingsCorpus" name="Savings Growth" stroke={BLUE} strokeWidth={1.5} fill="url(#rg2)"/>
                  <Area type="monotone" dataKey="corpus" name="Total Corpus" stroke={ACC} strokeWidth={2.5} fill="url(#rg1)"/>
                  <Line type="monotone" dataKey="target" name="Target Path" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="lbl" style={{marginBottom:14}}>Retirement Drawdown</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={checkResult.drawData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <defs><linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BLUE} stopOpacity={0.25}/><stop offset="95%" stopColor={BLUE} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
                  <XAxis dataKey="age" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Area type="monotone" dataKey="balance" name="Corpus Balance" stroke={BLUE} strokeWidth={2.5} fill="url(#ddg)"/>
                  <Line type="monotone" dataKey="withdrawal" name="Annual Withdrawal" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>)}
      </>)}

      {/* ══ SIP NEEDED ══ */}
      {mode==="sipneeded"&&(<>
        {/* INPUTS ROW */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* LEFT: Timeline + Financials */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="card" style={{padding:"20px 22px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Timeline</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {label:"Current Age",val:currentAge,set:setCurrentAge,color:ACC},
                  {label:"Retire At",val:sipRetireAge,set:setSipRetireAge,color:ACC},
                  {label:"Life Expectancy",val:lifeExp,set:setLifeExp,color:"#1A1714"},
                ].map(({label,val,set,color})=>(
                  <div key={label}>
                    <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{label}</div>
                    <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px"}}>
                      <ClearableInput value={val} onChange={set} step={1} min={18} color={color} isInt={true}
                        style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                      <span style={{fontSize:13,color:TEXT3,flexShrink:0,marginLeft:4}}>yrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{padding:"20px 22px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Financials</div>
              <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="₹" step={10000} min={0} color={ACC}/>
              <Field label="Monthly Expenses (today)" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={1000} min={0} color={ACC}/>
              <Field label="Target Corpus (0 = auto)" value={targetCorpus} onChange={setTargetCorpus} prefix="₹" step={100000} min={0} color={PURP}
                hint={`Auto: ${sipNeededResult?formatINR(sipNeededResult.autoCorpus):"calculating..."}`}/>
            </div>
          </div>
          {/* RIGHT: Rates & Step-Up */}
          <div className="card" style={{padding:"22px 24px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Rates & Step-Up</div>
            <Field label="Pre-retirement Return" value={preReturnRate} onChange={setPreReturnRate} suffix="% p.a." step={0.5} min={1} color={ACC}/>
            <Field label="Post-retirement Return" value={postReturnRate} onChange={setPostReturnRate} suffix="% p.a." step={0.5} min={1} color={BLUE}/>
            <Field label="Inflation" value={inflation} onChange={setInflation} suffix="% p.a." step={0.5} min={1} color="#F59E0B"/>
            <div style={{height:1,background:BORDER,margin:"8px 0 14px"}}/>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:110,flexShrink:0}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Step-Up %</div>
                <NumInput value={sipStep2Pct} onChange={v=>setSipStep2Pct(v)} step={1} min={0} max={50} suffix="%" color={sipStep2Pct>0?"#F59E0B":"#1A1714"} style={{input:{padding:"8px 10px",fontSize:15}}}/>
                <div style={{fontSize:11,color:TEXT3,marginTop:4}}>0 = none</div>
              </div>
              <div style={{flex:1,opacity:sipStep2Pct>0?1:0.3,pointerEvents:sipStep2Pct>0?"auto":"none"}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Increase Every</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>{
                    const active=sipStep2Freq===k&&sipStep2Pct>0;
                    return <div key={k} onClick={()=>setSipStep2Freq(k)}
                      style={{cursor:"pointer",padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,
                        background:active?"#F59E0B":"#FAF8F5",color:active?"#ffffff":TEXT2,border:`1.5px solid ${active?"#F59E0B":BORDER}`}}>{v.label}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {sipNeededResult&&(<>
          <div style={{background:"#F5F0FF",border:`1.5px solid ${PURP}50`,borderRadius:14,padding:"24px 28px"}}>
            <div style={{fontSize:12,color:PURP,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Monthly SIP Required to Retire at {sipRetireAge}</div>
            <div className="num" style={{fontWeight:700,fontSize:"clamp(28px,4vw,44px)",color:PURP,lineHeight:1}}>{formatINRFull(sipNeededResult.sipNeeded)}</div>
            {sipStep2Pct>0&&<div style={{fontSize:12,color:TEXT2,marginTop:8}}>Starting SIP with <strong style={{color:"#F59E0B"}}>{sipStep2Pct}% step-up</strong> · Without step-up: <strong style={{color:PURP}}>{formatINRFull(sipNeededResult.sipNeededFlat)}</strong></div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[["Target Corpus",formatINR(sipNeededResult.corpusTarget),PURP,"#F5F0FF",PURP+"30"],
              ["From Savings",formatINR(sipNeededResult.savingsC),"#9333EA","#F5F0FF",PURP+"20"],
              ["SIP Must Build",formatINR(Math.max(0,sipNeededResult.corpusTarget-sipNeededResult.savingsC)),"#7C3AED","#F5F0FF",PURP+"20"],
              ["Time to Retire",`${sipNeededResult.yearsToRetire} years`,ACC,"#FFFBF2",ACC+"30"],
            ].map(([l,v,c,bg,bc])=>(
              <div key={l} style={{background:bg,border:`1px solid ${bc}`,borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{l}</div>
                <div className="num" style={{fontWeight:700,fontSize:"clamp(16px,1.6vw,22px)",color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:14}}>Corpus Building Journey</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={sipNeededResult.accumData} margin={{top:4,right:16,left:0,bottom:0}}>
                <defs><linearGradient id="sng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PURP} stopOpacity={0.25}/><stop offset="95%" stopColor={PURP} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
                <XAxis dataKey="age" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey="corpus" name="Projected Corpus" stroke={PURP} strokeWidth={2.5} fill="url(#sng)"/>
                <Line type="monotone" dataKey="target" name="Target Path" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>)}
      </>)}

      {/* ══ RETIRE WHEN ══ */}
      {mode==="retirewhen"&&(<>
        {/* INPUTS ROW */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* LEFT: Timeline + Financials */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="card" style={{padding:"20px 22px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Timeline</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {label:"Current Age",val:currentAge,set:setCurrentAge,color:ACC},
                  {label:"Life Expectancy",val:lifeExp,set:setLifeExp,color:"#1A1714"},
                ].map(({label,val,set,color})=>(
                  <div key={label}>
                    <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{label}</div>
                    <div style={{display:"flex",alignItems:"center",background:"#FAF8F5",border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"8px 12px"}}>
                      <ClearableInput value={val} onChange={set} step={1} min={18} color={color} isInt={true}
                        style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'DM Mono',monospace",fontWeight:700,outline:"none",width:"100%",minWidth:0,lineHeight:1}}/>
                      <span style={{fontSize:13,color:TEXT3,flexShrink:0,marginLeft:4}}>yrs</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:12,color:TEXT3}}>We scan ages {currentAge+1}–80 to find when you can retire</div>
            </div>
            <div className="card" style={{padding:"20px 22px"}}>
              <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Financials</div>
              <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="₹" step={10000} min={0} color={ACC}/>
              <Field label="Monthly Expenses (today)" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={1000} min={0} color={ACC}/>
            </div>
          </div>
          {/* RIGHT: Rates & SIP */}
          <div className="card" style={{padding:"22px 24px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Rates & SIP</div>
            <Field label="Pre-retirement Return" value={preReturnRate} onChange={setPreReturnRate} suffix="% p.a." step={0.5} min={1} color={ACC}/>
            <Field label="Post-retirement Return" value={postReturnRate} onChange={setPostReturnRate} suffix="% p.a." step={0.5} min={1} color={BLUE}/>
            <Field label="Inflation" value={inflation} onChange={setInflation} suffix="% p.a." step={0.5} min={1} color="#F59E0B"/>
            <div style={{height:1,background:BORDER,margin:"8px 0 14px"}}/>
            <Field label="Monthly SIP" value={rwMonthlySIP} onChange={setRwMonthlySIP} prefix="₹" step={500} min={0} color="#EC4899"/>
            <div style={{display:"flex",gap:14,alignItems:"flex-start",marginTop:8}}>
              <div style={{width:110,flexShrink:0}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Step-Up %</div>
                <NumInput value={rwStepPct} onChange={v=>setRwStepPct(v)} step={1} min={0} max={50} suffix="%" color={rwStepPct>0?"#F59E0B":"#1A1714"} style={{input:{padding:"8px 10px",fontSize:15}}}/>
                <div style={{fontSize:11,color:TEXT3,marginTop:4}}>0 = none</div>
              </div>
              <div style={{flex:1,opacity:rwStepPct>0?1:0.3,pointerEvents:rwStepPct>0?"auto":"none"}}>
                <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Increase Every</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Object.entries(STEPUP_FREQS).filter(([k])=>k!=="none").map(([k,v])=>{
                    const active=rwStepFreq===k&&rwStepPct>0;
                    return <div key={k} onClick={()=>setRwStepFreq(k)}
                      style={{cursor:"pointer",padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,
                        background:active?"#F59E0B":"#FAF8F5",color:active?"#ffffff":TEXT2,border:`1.5px solid ${active?"#F59E0B":BORDER}`}}>{v.label}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {retireWhenResult&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{label:"Earliest You Can Retire",val:retireWhenResult.earliest,color:"#EC4899",bg:"#FDF0F6",bc:"#EC489940"},
              {label:"Comfortable (120% funded)",val:retireWhenResult.comfortable,color:GREEN,bg:"#EAF5EE",bc:GREEN+"40"}].map(({label,val,color,bg,bc})=>(
              <div key={label} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"22px 26px"}}>
                <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>{label}</div>
                {val?(
                  <><div className="num" style={{fontWeight:700,fontSize:48,color,lineHeight:1,marginBottom:8}}>{val.age}</div>
                  <div style={{fontSize:13,color:TEXT2}}>In <strong style={{color}}>{val.age-currentAge} years</strong> · {val.pct}% funded</div></>
                ):(
                  <div style={{fontWeight:700,fontSize:16,color:RED,marginTop:8}}>Not achievable by 80</div>
                )}
              </div>
            ))}
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:14}}>Corpus vs Required at Each Retirement Age</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={retireWhenResult.timeline} margin={{top:4,right:16,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
                <XAxis dataKey="age" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="corpus" name="Your Corpus" stroke="#EC4899" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                <Line type="monotone" dataKey="needed" name="Corpus Needed" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>)}
      </>)}
    </div>
  );
}


// ─── AFFORDABILITY: CAR ───────────────────────────────────────────────────────
function FinancesPanel({income,setIncome,expenses,setExpenses,expenseHint}){
  return(
    <div className="card">
      <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Your Finances</div>
      <Field label="Monthly Income (In-hand)" value={income} onChange={setIncome} prefix="₹" step={5000} min={0} color={ACC}/>
      <TipBox>💡 Add Employee PF, Employer PF, NPS — these don't hit your account but are real savings.</TipBox>
      <Field label="Monthly Expenses (incl. existing EMIs)" value={expenses} onChange={setExpenses} prefix="₹" step={2000} min={0} color={ACC} hint={expenseHint}/>
    </div>
  );
}

function CarAffordability({income,setIncome,expenses,setExpenses}){
  const [mode,setMode]=useState("check");
  const [carPrice,setCarPrice]=useState(1200000);
  const [downPct,setDownPct]=useState(20);
  const [rate,setRate]=useState(9.5);
  const [tenure,setTenure]=useState(5);
  const [insurance,setInsurance]=useState(0);
  const [maintenance,setMaintenance]=useState(6000);
  const [fuel,setFuel]=useState(6000);
  const [tyres,setTyres]=useState(0);
  const [emiPctOfIncome,setEmiPctOfIncome]=useState(15);
  const [discoverDownPct,setDiscoverDownPct]=useState(20);
  const [discoverRate,setDiscoverRate]=useState(9.5);
  const [discoverTenure,setDiscoverTenure]=useState(5);
  const [discoverRunning,setDiscoverRunning]=useState(8000);

  const insAuto=Math.round(carPrice*0.025/1000)*1000;
  const effectiveIns=insurance>0?insurance:insAuto;
  const tyreAutoMonthly=Math.round((carPrice<500000?3000:carPrice<1500000?5000:9000)*4/5/12/100)*100;
  const effectiveTyres=tyres>0?tyres:tyreAutoMonthly;

  const check=useMemo(()=>{
    const down=carPrice*downPct/100,loan=carPrice-down,r=rate/12/100,n=tenure*12;
    const emi=r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const monthlyIns=effectiveIns/12,monthlyCost=emi+monthlyIns+maintenance+fuel+effectiveTyres;
    const emiPct=emi/income*100,totalCostPct=monthlyCost/income*100,disposable=income-expenses-monthlyCost;
    const totalOwnership=down+emi*n+effectiveIns*tenure+maintenance*12*tenure+fuel*12*tenure+effectiveTyres*12*tenure;
    const comfortable=emiPct<=15,manageable=emiPct<=25;
    const verdict=comfortable?"Comfortable 😊":manageable?"Manageable ⚠️":"Stretched 🔴";
    const verdictColor=comfortable?GREEN:manageable?"#F59E0B":RED;
    const breakdown=[
      {name:"Down Payment",value:Math.round(down),color:BLUE},
      {name:"Loan Interest",value:Math.round(emi*n-loan),color:"#F59E0B"},
      {name:"Insurance",value:Math.round(effectiveIns*tenure),color:"#EC4899"},
      {name:"Maintenance",value:Math.round(maintenance*12*tenure),color:PURP},
      {name:"Tyres",value:Math.round(effectiveTyres*12*tenure),color:"#10B981"},
      {name:"Fuel",value:Math.round(fuel*12*tenure),color:ACC},
    ];
    return{down,loan,emi,monthlyCost,emiPct,totalCostPct,disposable,totalOwnership,breakdown,verdict,verdictColor,comfortable,manageable};
  },[carPrice,downPct,rate,tenure,effectiveIns,maintenance,fuel,effectiveTyres,income,expenses]);

  const discover=useMemo(()=>{
    const disposableAfterExpenses=income-expenses,runningBudget=discoverRunning||0;
    const budgetForEmi=Math.max(0,disposableAfterExpenses-runningBudget),emiCap=income*emiPctOfIncome/100;
    const maxEmi=Math.min(budgetForEmi,emiCap),r=discoverRate/12/100,n=discoverTenure*12;
    const loanAmt=r===0?maxEmi*n:maxEmi*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
    const maxCarPrice=loanAmt/(1-discoverDownPct/100),down=maxCarPrice*discoverDownPct/100;
    return{maxEmi,loanAmt:Math.round(loanAmt),maxCarPrice:Math.round(maxCarPrice),down:Math.round(down),
      totalMonthly:Math.round(maxEmi+runningBudget),runningBudget,disposableAfterExpenses,emiCap,limitedByRunning:budgetForEmi<emiCap};
  },[income,expenses,emiPctOfIncome,discoverDownPct,discoverRate,discoverTenure,discoverRunning]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* MODE TOGGLE */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:500}}>
        {[{k:"check",label:"Is it affordable?",desc:"Enter car price"},{k:"discover",label:"What can I afford?",desc:"Find your budget"}].map(m=>(
          <div key={m.k} onClick={()=>setMode(m.k)}
            style={{padding:"14px 20px",borderRadius:12,cursor:"pointer",border:`1.5px solid ${mode===m.k?BLUE:BORDER}`,
              background:mode===m.k?BLUE_L:"#ffffff",transition:"all 0.15s"}}>
            <div style={{fontSize:14,fontWeight:700,color:mode===m.k?BLUE:TEXT2}}>{m.label}</div>
            <div style={{fontSize:12,color:TEXT3,marginTop:2}}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* ── CHECK MODE ── */}
      {mode==="check"&&(<>
        {/* INPUTS */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          {/* Finances */}
          <div className="card" style={{padding:"20px 22px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Your Finances</div>
            <Field label="Monthly Income" value={income} onChange={setIncome} prefix="₹" step={5000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:14}}>
              💡 Add Employee PF, Employer PF, NPS — these don't hit your account but are real savings.
            </div>
            <Field label="Monthly Expenses (existing EMIs)" value={expenses} onChange={setExpenses} prefix="₹" step={2000} min={0} color={ACC}/>
            <div style={{background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Include rent, food, utilities, all existing EMIs — except this car.
            </div>
          </div>
          {/* Car Details */}
          <div className="card" style={{padding:"20px 22px",borderColor:BLUE+"40"}}>
            <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Car Details</div>
            <Field label="Car Price (On Road)" value={carPrice} onChange={setCarPrice} prefix="₹" step={50000} min={0} color={BLUE}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" step={5} min={0} color={BLUE}/>
              <Field label="Interest Rate" value={rate} onChange={setRate} suffix="%" step={0.1} min={0} color={BLUE}/>
            </div>
            <div style={{background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.5,marginTop:-2,marginBottom:14}}>
              💡 PSU banks 8.5–10% · Private 9.5–12% · NBFCs 12–16%
            </div>
            <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color={BLUE}/>
          </div>
          {/* Running Costs */}
          <div className="card" style={{padding:"20px 22px",borderColor:BLUE+"40"}}>
            <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Running Costs</div>
            <Field label="Annual Insurance" value={effectiveIns} onChange={setInsurance} prefix="₹" step={1000} min={0} color={BLUE}/>
            <div style={{background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.5,marginTop:-6,marginBottom:14}}>
              💡 Auto-estimated at 2.5% of on-road price.
            </div>
            <Field label="Monthly Maintenance" value={maintenance} onChange={setMaintenance} prefix="₹" step={500} min={0} color={BLUE}/>
            <div style={{background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.5,marginTop:-6,marginBottom:14}}>
              💡 Thumb rule: ~1.5% of on-road price per year — includes routine servicing + tyre amortisation.
            </div>
            <Field label="Monthly Fuel / Charging" value={fuel} onChange={setFuel} prefix="₹" step={500} min={0} color={BLUE}/>


          </div>
        </div>

        {/* RESULTS */}
        <div style={{background:check.comfortable?"#EAF5EE":check.manageable?"#FFFBEB":"#FDEAEA",border:`2px solid ${check.verdictColor}`,borderRadius:16,padding:"28px 32px",display:"flex",alignItems:"center",gap:24}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:32,color:check.verdictColor,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              {check.comfortable?"✓ Comfortable":check.manageable?"⚠ Manageable":"✗ Stretched"}
            </div>
            <div style={{fontSize:15,color:TEXT2,display:"flex",gap:24,flexWrap:"wrap"}}>
              <span>EMI <strong style={{color:check.verdictColor,fontSize:17}}>{check.emiPct.toFixed(1)}%</strong> of income</span>
              <span>Total monthly spend (incl. EMI) <strong style={{color:check.verdictColor,fontSize:17}}>{formatINRFull(check.monthlyCost)}</strong></span>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:13,color:TEXT3,marginBottom:6,letterSpacing:"0.5px",textTransform:"uppercase",fontWeight:600}}>Monthly Surplus</div>
            <div className="num" style={{fontWeight:800,fontSize:36,color:check.disposable>0?GREEN:RED,lineHeight:1}}>{formatINRFull(check.disposable)}</div>
            <div style={{fontSize:12,color:TEXT3,marginTop:4}}>after all car costs</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"Monthly EMI",v:formatINRFull(check.emi),c:BLUE,bg:"#F0F4FF",bc:BLUE+"40"},
            {l:"Total Monthly Spend (incl. EMI)",v:formatINRFull(check.monthlyCost),c:BLUE,bg:"#F0F4FF",bc:BLUE+"30"},
            {l:"Down Payment",v:formatINR(check.down),c:TEXT2,bg:"#ffffff",bc:BORDER},
            {l:`Total Cost (${tenure}Y)`,v:formatINR(check.totalOwnership),c:TEXT2,bg:"#ffffff",bc:BORDER},
          ].map(({l,v,c,bg,bc})=>(
            <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{l}</div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(18px,1.8vw,24px)",color:c,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>

        {/* EMI Gauge */}
        <div className="card">
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>EMI Comfort Gauge</div>
          <div style={{position:"relative",height:12,borderRadius:6,background:BORDER,overflow:"hidden",marginBottom:8}}>
            <div style={{position:"absolute",left:0,height:"100%",width:`${Math.min(check.emiPct,100)}%`,background:check.verdictColor,borderRadius:6}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:TEXT3}}>
            <span style={{color:GREEN}}>0–15% Comfortable</span>
            <span style={{color:"#F59E0B"}}>15–25% Manageable</span>
            <span style={{color:RED}}>25%+ Stretched</span>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="card">
          <div className="lbl" style={{marginBottom:14}}>Total Cost of Ownership over {tenure} years</div>
          {check.breakdown.map((d,i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{color:d.color}}>● {d.name}</span>
                <span className="num" style={{color:"#1A1714",fontWeight:600}}>{formatINR(d.value)}</span>
              </div>
              <div style={{height:6,borderRadius:3,background:BORDER,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(d.value/check.totalOwnership*100).toFixed(0)}%`,background:d.color,borderRadius:3}}/>
              </div>
            </div>
          ))}
          <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:10,display:"flex",justifyContent:"space-between"}}>
            <span style={{color:ACC,fontSize:13,fontWeight:600}}>Total</span>
            <span className="num" style={{fontWeight:700,color:"#1A1714",fontSize:15}}>{formatINR(check.totalOwnership)}</span>
          </div>
        </div>
      </>)}

      {/* ── DISCOVER MODE ── */}
      {mode==="discover"&&(<>
        {/* INPUTS */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div className="card" style={{padding:"20px 22px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Your Finances</div>
            <Field label="Monthly Income" value={income} onChange={setIncome} prefix="₹" step={5000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:14}}>
              💡 Add Employee PF, Employer PF, NPS — these don't hit your account but are real savings.
            </div>
            <Field label="Monthly Expenses (existing EMIs)" value={expenses} onChange={setExpenses} prefix="₹" step={2000} min={0} color={ACC}/>
            <div style={{background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Include rent, food, utilities, all existing EMIs — except this car.
            </div>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:BLUE+"40"}}>
            <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Comfort Level</div>
            <Field label="Max EMI as % of Income" value={emiPctOfIncome} onChange={setEmiPctOfIncome} suffix="%" step={1} min={1} color={BLUE}/>
            <Field label="Monthly Running Cost Budget" value={discoverRunning} onChange={setDiscoverRunning} prefix="₹" step={500} min={0} color={BLUE}/>
            <div style={{background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Insurance/12 + maintenance + fuel costs combined.
            </div>

          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:BLUE+"40"}}>
            <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Loan Settings</div>
            <Field label="Down Payment" value={discoverDownPct} onChange={setDiscoverDownPct} suffix="%" step={5} min={0} color={BLUE}/>
            <Field label="Interest Rate" value={discoverRate} onChange={setDiscoverRate} suffix="%" step={0.1} min={0} color={BLUE}/>
            <Field label="Tenure" value={discoverTenure} onChange={setDiscoverTenure} suffix="years" step={1} min={1} color={BLUE}/>
          </div>
        </div>

        {/* RESULTS */}
        <div style={{background:"#E8F0FA",border:`1.5px solid ${BLUE}`,borderRadius:14,padding:"24px 28px"}}>
          <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Max Car Price You Can Afford</div>
          <div className="num" style={{fontWeight:700,fontSize:"clamp(28px,4vw,44px)",color:BLUE,lineHeight:1}}>{formatINR(discover.maxCarPrice)}</div>
          <div style={{fontSize:13,color:TEXT2,marginTop:8}}>Max EMI: <strong style={{color:BLUE}}>{formatINRFull(discover.maxEmi)}/mo</strong> · {discoverTenure}Y at {discoverRate}%
            {discover.limitedByRunning&&<span style={{color:"#F59E0B",marginLeft:8}}>⚠ Limited by cash flow</span>}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"Max Car Price",v:formatINR(discover.maxCarPrice),c:BLUE,bg:"#E8F0FA",bc:BLUE+"40"},
            {l:"Max Loan",v:formatINR(discover.loanAmt),c:BLUE,bg:"#F0F4FF",bc:BLUE+"30"},
            {l:"Down Payment",v:formatINR(discover.down),c:TEXT2,bg:"#ffffff",bc:BORDER},
            {l:"Total Monthly",v:formatINR(discover.totalMonthly),c:TEXT2,bg:"#ffffff",bc:BORDER},
          ].map(({l,v,c,bg,bc})=>(
            <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{l}</div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(18px,1.8vw,24px)",color:c,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="lbl" style={{marginBottom:12}}>Max Car Price at Different EMI % Caps</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${BORDER}`}}>
              {["EMI % Cap","Max EMI/mo","Max Loan","Max Car Price","Comfort"].map(h=>(
                <th key={h} style={{padding:"6px 10px",textAlign:"right",color:TEXT2,fontWeight:700,fontSize:12}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[10,15,20,25,30].map(p=>{
                const emiCap=income*p/100,budgetAfter=Math.max(0,income-expenses-discover.runningBudget);
                const maxE=Math.min(budgetAfter,emiCap),r2=discoverRate/12/100,n2=discoverTenure*12;
                const loan2=r2===0?maxE*n2:maxE*(Math.pow(1+r2,n2)-1)/(r2*Math.pow(1+r2,n2));
                const carP=loan2/(1-discoverDownPct/100);
                const color=p<=15?GREEN:p<=25?"#F59E0B":RED;
                const label=p<=15?"Comfortable":p<=25?"Manageable":"Stretched";
                const isSelected=p===emiPctOfIncome;
                return(
                  <tr key={p} style={{borderBottom:`1px solid #F2F0EB`,background:isSelected?"#E8F0FA":"transparent",cursor:"pointer"}} onClick={()=>setEmiPctOfIncome(p)}>
                    <td className="num" style={{padding:"8px 10px",color,fontWeight:isSelected?700:400}}>{p}%{isSelected?" ←":""}</td>
                    <td className="num" style={{padding:"8px 10px",textAlign:"right",color:TEXT2}}>{formatINR(maxE)}</td>
                    <td className="num" style={{padding:"8px 10px",textAlign:"right",color:TEXT2}}>{formatINR(loan2)}</td>
                    <td className="num" style={{padding:"8px 10px",textAlign:"right",color,fontWeight:600}}>{formatINR(carP)}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",color}}>{label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
}

function CarPage(){
  const [income,setIncome]=useState(150000);
  const [expenses,setExpenses]=useState(50000);
  return <CarAffordability income={income} setIncome={setIncome} expenses={expenses} setExpenses={setExpenses}/>;
}

// ─── HOUSE PAGE (simplified but complete) ────────────────────────────────────
function HousePage(){
  const [income,setIncome]=useState(150000);
  const [expenses,setExpenses]=useState(50000);
  const [mode,setMode]=useState("check");
  const [housePrice,setHousePrice]=useState(7500000);
  const [downPct,setDownPct]=useState(20);
  const [rate,setRate]=useState(8.5);
  const [tenure,setTenure]=useState(20);
  const [maintenance,setMaintenance]=useState(5000);
  const [emiPctOfIncome,setEmiPctOfIncome]=useState(30);
  const [discoverDownPct,setDiscoverDownPct]=useState(20);
  const [discoverRate,setDiscoverRate]=useState(8.5);
  const [discoverTenure,setDiscoverTenure]=useState(20);
  const [rent,setRent]=useState(25000);
  const [rentIncrease,setRentIncrease]=useState(5);
  const [appreciation,setAppreciation]=useState(7);
  const [investReturn,setInvestReturn]=useState(12);

  const check=useMemo(()=>{
    const down=housePrice*downPct/100,loan=housePrice-down,r=rate/12/100,n=tenure*12;
    const emi=r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const monthlyCost=emi+maintenance,emiPct=emi/income*100,disposable=income-expenses-monthlyCost;
    const finalVal=housePrice*Math.pow(1+appreciation/100,tenure),equityBuilt=finalVal-loan;
    const comfortable=emiPct<=30,manageable=emiPct<=45;
    const verdict=comfortable?"Comfortable 😊":manageable?"Manageable ⚠️":"Stretched 🔴";
    const verdictColor=comfortable?GREEN:manageable?"#F59E0B":RED;
    return{down,loan,emi,monthlyCost,emiPct,disposable,finalVal,equityBuilt,verdict,verdictColor,comfortable,manageable};
  },[housePrice,downPct,rate,tenure,maintenance,income,expenses,appreciation]);

  const discover=useMemo(()=>{
    const maxEmi=income*emiPctOfIncome/100,r=discoverRate/12/100,n=discoverTenure*12;
    const loan=r===0?maxEmi*n:maxEmi*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
    const maxPrice=loan/(1-discoverDownPct/100),down=maxPrice*discoverDownPct/100;
    return{maxEmi,loan:Math.round(loan),maxPrice:Math.round(maxPrice),down:Math.round(down)};
  },[income,emiPctOfIncome,discoverDownPct,discoverRate,discoverTenure]);

  const rentorbuy=useMemo(()=>{
    const down=housePrice*downPct/100,loan=housePrice-down,r=rate/12/100,n=tenure*12;
    const emi=r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    let rentAmt=rent,rentCorpus=down,houseVal=housePrice;const data=[];
    for(let y=1;y<=tenure;y++){
      houseVal*=(1+appreciation/100);rentAmt*=(1+rentIncrease/100);
      rentCorpus*=(1+investReturn/100);if(emi>rent)rentCorpus+=(emi-rent)*12;
      const outstanding=loan*(Math.pow(1+r,y*12)-1)/(Math.pow(1+r,n)-1);
      const equity=Math.max(houseVal-(loan-outstanding),0);
      data.push({year:y,buy:Math.round(equity),rent:Math.round(rentCorpus),buyMonthly:Math.round(emi+maintenance),rentMonthly:Math.round(rent*Math.pow(1+rentIncrease/100,y-1))});
    }
    const crossover=data.find((d,i)=>i>0&&data[i-1].buy<=data[i-1].rent&&d.buy>d.rent);
    return{data,crossover,emi};
  },[housePrice,downPct,rate,tenure,maintenance,rent,rentIncrease,appreciation,investReturn]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* MODE TOGGLE */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{k:"check",label:"Is it affordable?",desc:"Enter house price"},{k:"discover",label:"What can I afford?",desc:"Find your budget"},{k:"rentorbuy",label:"Rent or Buy?",desc:"Compare both paths"}].map(m=>(
          <div key={m.k} onClick={()=>setMode(m.k)}
            style={{padding:"14px 22px",borderRadius:12,cursor:"pointer",border:`1.5px solid ${mode===m.k?ACC:BORDER}`,
              background:mode===m.k?ACC_L:"#ffffff",transition:"all 0.15s",minWidth:160}}>
            <div style={{fontSize:14,fontWeight:700,color:mode===m.k?ACC_D:TEXT2}}>{m.label}</div>
            <div style={{fontSize:12,color:TEXT3,marginTop:2}}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* ── CHECK MODE ── */}
      {mode==="check"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div className="card" style={{padding:"20px 22px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Your Finances</div>
            <Field label="Monthly Income" value={income} onChange={setIncome} prefix="₹" step={5000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:14}}>
              💡 Add Employee PF, Employer PF, NPS — these don't hit your account but are real savings.
            </div>
            <Field label="Monthly Expenses (existing EMIs)" value={expenses} onChange={setExpenses} prefix="₹" step={2000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Include rent, food, utilities, all existing EMIs — except this house.
            </div>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Property Details</div>
            <Field label="House Price" value={housePrice} onChange={setHousePrice} prefix="₹" step={500000} min={0} color={ACC}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" step={5} min={0} color={ACC}/>
              <Field label="Interest Rate" value={rate} onChange={setRate} suffix="%" step={0.1} min={0} color={ACC}/>
            </div>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-2,marginBottom:14}}>
              💡 PSU banks 8–9.5% · Private 8.5–10.5% · Check PMAY subsidy if eligible
            </div>
            <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color={ACC}/>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Additional Costs</div>
            <Field label="Monthly Maintenance" value={maintenance} onChange={setMaintenance} prefix="₹" step={500} min={0} color={ACC} hint="Society: ₹2–10K/mo"/>
          </div>
        </div>

        {/* VERDICT */}
        <div style={{background:check.comfortable?"#EAF5EE":check.manageable?"#FFFBEB":"#FDEAEA",border:`1.5px solid ${check.verdictColor}`,borderRadius:14,padding:"20px 26px",display:"flex",alignItems:"center",gap:20}}>
          <div style={{fontSize:40}}>{check.comfortable?"🏠":check.manageable?"⚠️":"🔴"}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:22,color:check.verdictColor}}>{check.verdict}</div>
            <div style={{fontSize:13,color:TEXT2,marginTop:4}}>EMI is <strong style={{color:check.verdictColor}}>{check.emiPct.toFixed(1)}%</strong> of income · Total monthly cost <strong style={{color:check.verdictColor}}>{formatINRFull(check.monthlyCost)}</strong></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:TEXT3,marginBottom:4}}>Remaining</div>
            <div className="num" style={{fontWeight:700,fontSize:24,color:check.disposable>0?GREEN:RED}}>{formatINR(check.disposable)}</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"Monthly EMI",v:formatINRFull(check.emi),c:ACC,bg:"#FFFBF2",bc:ACC+"50"},
            {l:"Down Payment",v:formatINR(check.down),c:GREEN,bg:"#EAF5EE",bc:GREEN+"40"},
            {l:`Value in ${tenure}Y`,v:formatINR(check.finalVal),c:GREEN,bg:"#EAF5EE",bc:GREEN+"30"},
            {l:"Equity Built",v:formatINR(check.equityBuilt),c:TEXT2,bg:"#ffffff",bc:BORDER},
          ].map(({l,v,c,bg,bc})=>(
            <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{l}</div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(18px,1.8vw,24px)",color:c,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>EMI Comfort Gauge</div>
          <div style={{position:"relative",height:12,borderRadius:6,background:BORDER,overflow:"hidden",marginBottom:8}}>
            <div style={{position:"absolute",left:0,height:"100%",width:`${Math.min(check.emiPct,100)}%`,background:check.verdictColor,borderRadius:6}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:TEXT3}}>
            <span style={{color:GREEN}}>0–30% Comfortable</span>
            <span style={{color:"#F59E0B"}}>30–45% Manageable</span>
            <span style={{color:RED}}>45%+ Stretched</span>
          </div>
        </div>
      </>)}

      {/* ── DISCOVER MODE ── */}
      {mode==="discover"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div className="card" style={{padding:"20px 22px"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Your Finances</div>
            <Field label="Monthly Income" value={income} onChange={setIncome} prefix="₹" step={5000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:14}}>
              💡 Add Employee PF, Employer PF, NPS — these don't hit your account but are real savings.
            </div>
            <Field label="Monthly Expenses (existing EMIs)" value={expenses} onChange={setExpenses} prefix="₹" step={2000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Include rent, food, utilities, all existing EMIs — except this house.
            </div>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Comfort Level</div>
            <Field label="Max EMI as % of Income" value={emiPctOfIncome} onChange={setEmiPctOfIncome} suffix="%" step={5} min={5} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 RBI guideline: EMI ≤ 40–50% of net income.
            </div>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Loan Settings</div>
            <Field label="Down Payment" value={discoverDownPct} onChange={setDiscoverDownPct} suffix="%" step={5} min={10} color={ACC}/>
            <Field label="Interest Rate" value={discoverRate} onChange={setDiscoverRate} suffix="%" step={0.1} min={0} color={ACC}/>
            <Field label="Tenure" value={discoverTenure} onChange={setDiscoverTenure} suffix="years" step={1} min={1} color={ACC}/>
          </div>
        </div>

        <div style={{background:"#FFFBF2",border:`1.5px solid ${ACC}`,borderRadius:14,padding:"24px 28px"}}>
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Max Home Price You Can Afford</div>
          <div className="num" style={{fontWeight:700,fontSize:"clamp(28px,4vw,44px)",color:ACC,lineHeight:1}}>{formatINR(discover.maxPrice)}</div>
          <div style={{fontSize:13,color:TEXT2,marginTop:8}}>at {emiPctOfIncome}% → max EMI <strong style={{color:ACC}}>{formatINRFull(discover.maxEmi)}/mo</strong></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"Max Home Price",v:formatINR(discover.maxPrice),c:ACC,bg:"#FFFBF2",bc:ACC+"50"},
            {l:"Max Loan",v:formatINR(discover.loan),c:GREEN,bg:"#EAF5EE",bc:GREEN+"40"},
            {l:"Down Needed",v:formatINR(discover.down),c:TEXT2,bg:"#ffffff",bc:BORDER},
            {l:"Max Monthly EMI",v:formatINRFull(discover.maxEmi),c:ACC,bg:"#FFFBF2",bc:ACC+"30"},
          ].map(({l,v,c,bg,bc})=>(
            <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{l}</div>
              <div className="num" style={{fontWeight:700,fontSize:"clamp(18px,1.8vw,24px)",color:c,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── RENT OR BUY MODE ── */}
      {mode==="rentorbuy"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
            <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Property (Buy)</div>
            <Field label="House Price" value={housePrice} onChange={setHousePrice} prefix="₹" step={500000} min={0} color={ACC}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" step={5} min={0} color={ACC}/>
              <Field label="Interest Rate" value={rate} onChange={setRate} suffix="%" step={0.1} min={0} color={ACC}/>
            </div>
            <Field label="Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} color={ACC}/>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:PURP+"40"}}>
            <div style={{fontSize:12,color:PURP,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Renting Scenario</div>
            <Field label="Current Monthly Rent" value={rent} onChange={setRent} prefix="₹" step={1000} min={0} color={PURP}/>
            <Field label="Annual Rent Increase" value={rentIncrease} onChange={setRentIncrease} suffix="%" step={0.5} min={0} color={PURP}/>
          </div>
          <div className="card" style={{padding:"20px 22px",borderColor:GREEN+"40"}}>
            <div style={{fontSize:12,color:GREEN,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Growth Assumptions</div>
            <Field label="Property Appreciation" value={appreciation} onChange={setAppreciation} suffix="%" step={0.5} min={0} color={GREEN}/>
            <Field label="Investment Return (if renting)" value={investReturn} onChange={setInvestReturn} suffix="%" step={0.5} min={0} color={GREEN}/>
            <div style={{background:"#EAF5EE",border:`1px solid ${GREEN}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:"#1B5E35",lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Assumes down payment + monthly (EMI − rent) difference is invested in mutual funds.
            </div>
          </div>
        </div>

        {/* VERDICT */}
        <div style={{background:"#ffffff",border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"20px 26px",display:"flex",gap:24,flexWrap:"wrap",alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,color:TEXT3,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Buy — Monthly</div>
            <div className="num" style={{fontWeight:700,fontSize:24,color:ACC}}>{formatINR(rentorbuy.emi+maintenance)}</div>
          </div>
          <div style={{width:1,height:40,background:BORDER}}/>
          <div>
            <div style={{fontSize:11,color:TEXT3,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Rent — Monthly</div>
            <div className="num" style={{fontWeight:700,fontSize:24,color:PURP}}>{formatINR(rent)}</div>
          </div>
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            {rentorbuy.crossover?(
              <>
                <div style={{fontSize:11,color:TEXT3,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Buy becomes better at</div>
                <div className="num" style={{fontWeight:700,fontSize:28,color:GREEN}}>Year {rentorbuy.crossover.year}</div>
              </>
            ):(
              <>
                <div style={{fontSize:11,color:TEXT3,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Verdict in {tenure}Y</div>
                <div className="num" style={{fontWeight:700,fontSize:22,color:rentorbuy.data[rentorbuy.data.length-1]?.buy>rentorbuy.data[rentorbuy.data.length-1]?.rent?ACC:PURP}}>
                  {rentorbuy.data[rentorbuy.data.length-1]?.buy>rentorbuy.data[rentorbuy.data.length-1]?.rent?"Buy wins 🏠":"Rent wins 📈"}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="lbl" style={{marginBottom:14}}>Net Worth — Buy vs Rent</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rentorbuy.data} margin={{top:4,right:16,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
              <XAxis dataKey="year" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
              <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="buy" name="Buy (Equity)" stroke={ACC} strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
              <Line type="monotone" dataKey="rent" name="Rent (Invest)" stroke={PURP} strokeWidth={2.5} strokeDasharray="5 4" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>)}
    </div>
  );
}


// ─── GRATUITY PAGE ────────────────────────────────────────────────────────────
function GratuityPage(){
  const [lastSalary,setLastSalary]=React.useState(50000);
  const [yearsOfService,setYearsOfService]=React.useState(8);
  const [monthsOfService,setMonthsOfService]=React.useState(4);
  const [employeeType,setEmployeeType]=React.useState("covered");
  const [currentAge,setCurrentAge]=React.useState(35);
  const [retirementAge,setRetirementAge]=React.useState(60);
  const [salaryHike,setSalaryHike]=React.useState(8);

  const divisor=employeeType==="covered"?26:30;
  const roundedYears=monthsOfService>=6?yearsOfService+1:yearsOfService;
  const gratuityRaw=(lastSalary*15/divisor)*roundedYears;
  const gratuity=Math.min(gratuityRaw,2000000);
  const taxExemptLimit=employeeType==="covered"?2000000:1000000;
  const taxableGratuity=Math.max(0,gratuity-taxExemptLimit);
  const isEligible=yearsOfService>=5||(yearsOfService===4&&monthsOfService>=8);
  const yearsToRetire=Math.max(1,retirementAge-currentAge);
  const projSalary=lastSalary*Math.pow(1+salaryHike/100,yearsToRetire);
  const projYears=yearsOfService+yearsToRetire;
  const projRoundedYears=monthsOfService>=6?projYears+1:projYears;
  const projGratuity=Math.min((projSalary*15/divisor)*projRoundedYears,2000000);

  const yearData=[];
  const nYears=Math.min(Math.max(1,yearsToRetire),40);
  for(let y=1;y<=nYears;y++){
    const sal=Math.round(lastSalary*Math.pow(1+salaryHike/100,y));
    const yrs=yearsOfService+y,rY=monthsOfService>=6?yrs+1:yrs;
    const g=Math.min((sal*15/divisor)*rY,2000000);
    yearData.push({age:currentAge+y,years:yrs,salary:sal,gratuity:Math.round(g)});
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* INPUTS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>

        {/* Employee Details */}
        <div className="card" style={{padding:"20px 22px",borderColor:"#F59E0B40"}}>
          <div style={{fontSize:12,color:"#D97706",letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Employee Details</div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Organisation Type</div>
            <PillRow options={[["covered","Covered (10+)"],["notcovered","Not Covered"]]} value={employeeType} set={setEmployeeType} activeColor="#F59E0B"/>
            <div style={{background:"#FFFBEB",border:"1px solid #F59E0B30",borderRadius:7,padding:"8px 12px",fontSize:12,color:"#92400E",lineHeight:1.5,marginTop:8}}>
              💡 {employeeType==="covered"?"Payment of Gratuity Act 1972 · Formula: Salary × 15/26 · Statutory cap & tax exemption: ₹20L":"Gratuitous payment (not under Act) · Formula: Salary × 15/30 · Tax exemption limit: ₹10L"}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Current Age" value={currentAge} onChange={setCurrentAge} suffix=" yrs" step={1} min={18} color="#F59E0B"/>
            <Field label="Retirement Age" value={retirementAge} onChange={v=>setRetirementAge(Math.max(currentAge+1,v))} suffix=" yrs" step={1} min={currentAge+1} color="#F59E0B"/>
          </div>
        </div>

        {/* Salary & Service */}
        <div className="card" style={{padding:"20px 22px",borderColor:ACC+"40"}}>
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Salary & Service</div>
          <Field label="Last Drawn Basic + DA (monthly)" value={lastSalary} onChange={setLastSalary} prefix="₹" step={1000} min={0} color={ACC}/>
            <div style={{background:ACC_L,border:`1px solid ${ACC}30`,borderRadius:7,padding:"8px 12px",fontSize:12,color:ACC_D,lineHeight:1.5,marginTop:-6,marginBottom:6}}>
              💡 Use Basic + DA only. Exclude HRA, bonus, allowances — gratuity is calculated only on this component.
            </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Years of Service" value={yearsOfService} onChange={setYearsOfService} suffix=" yrs" step={1} min={0} color={ACC}/>
            <Field label="Extra Months" value={monthsOfService} onChange={v=>setMonthsOfService(Math.min(11,Math.max(0,Math.round(v))))} suffix=" mo" step={1} min={0} color={ACC}/>
          </div>
          <div style={{background:ACC_L,border:`1px solid ${ACC}40`,borderRadius:7,padding:"7px 11px",fontSize:12,color:ACC_D}}>
            {yearsOfService}y {monthsOfService}m → rounded to <strong>{roundedYears} years</strong>
            {monthsOfService>=6?" (≥6m rounds up)":" (<6m rounds down)"}
          </div>
        </div>

        {/* Projection */}
        <div className="card" style={{padding:"20px 22px",borderColor:BLUE+"40"}}>
          <div style={{fontSize:12,color:BLUE,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Projection</div>
          <Field label="Expected Annual Salary Hike" value={salaryHike} onChange={setSalaryHike} suffix="%" step={0.5} min={0} color={BLUE}/>
          <div style={{marginTop:8,background:BLUE_L,border:`1px solid ${BLUE}20`,borderRadius:7,padding:"8px 12px",fontSize:12,color:BLUE,lineHeight:1.6}}>
            💡 Projects gratuity at retirement based on salary growth and additional service years.
          </div>
        </div>
      </div>

      {/* ELIGIBILITY BANNER */}
      <div style={{background:isEligible?"#EAF5EE":"#FFF0E6",border:`1.5px solid ${isEligible?GREEN:"#F97316"}`,borderRadius:14,padding:"18px 24px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:28}}>{isEligible?"✅":"⏳"}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:18,color:isEligible?GREEN:"#F97316"}}>{isEligible?"Eligible for Gratuity":"Not Yet Eligible"}</div>
          <div style={{fontSize:13,color:TEXT2,marginTop:3}}>
            {isEligible?`${yearsOfService}y ${monthsOfService}m of continuous service qualifies`:`Minimum 5 years required · ${Math.max(0,5-yearsOfService)} more year(s) to go`}
          </div>
        </div>
      </div>

      {/* KEY RESULTS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[
          {l:"Gratuity (Current)",v:formatINR(gratuity),c:ACC,bg:"#FFFBF2",bc:ACC+"50",sub:`${roundedYears} yrs · ${divisor===26?"Covered Act":"Not Covered"}`},
          {l:"Tax Exempt",v:formatINR(Math.min(gratuity,taxExemptLimit)),c:GREEN,bg:"#EAF5EE",bc:GREEN+"40",sub:`Limit: ${formatINR(taxExemptLimit)}`},
          {l:"Taxable Amount",v:formatINR(taxableGratuity),c:taxableGratuity>0?"#D97706":TEXT3,bg:taxableGratuity>0?"#FFFBEB":"#ffffff",bc:taxableGratuity>0?"#F59E0B40":BORDER,sub:taxableGratuity>0?"Added to income":"Fully exempt"},
          {l:"Monthly Accrual",v:formatINR(Math.round(lastSalary*15/divisor/12)),c:BLUE,bg:"#F0F4FF",bc:BLUE+"40",sub:"earned per month (approx)"},
          {l:"Gratuity at Retirement",v:formatINR(projGratuity),c:PURP,bg:"#F5F0FF",bc:PURP+"40",sub:`Age ${retirementAge} · ${projYears}y service`},
          {l:"Salary at Retirement",v:formatINR(Math.round(projSalary)),c:TEXT2,bg:"#ffffff",bc:BORDER,sub:`At ${salaryHike}% annual hike`},
        ].map(({l,v,c,bg,bc,sub})=>(
          <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"18px 22px"}}>
            <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{l}</div>
            <div className="num" style={{fontWeight:700,fontSize:"clamp(18px,1.8vw,24px)",color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:TEXT3,marginTop:6}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* COMPUTATION + CHART */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:"#1A1714",marginBottom:12}}>Step-by-Step Computation</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {[
                {l:"Last Basic + DA (monthly)",v:formatINR(lastSalary),c:TEXT3},
                {l:`Multiply: 15 ÷ ${divisor}`,v:formatINR(Math.round(lastSalary*15/divisor)),c:TEXT3},
                {l:`Multiply: ${roundedYears} years`,v:formatINR(Math.round(gratuityRaw)),c:"#F59E0B",bold:true},
                {l:"Statutory cap (₹20L)",v:gratuityRaw>2000000?"Applied":"Not applicable",c:TEXT3},
                {l:"Final Gratuity",v:formatINR(gratuity),c:ACC,bold:true},
                {l:"Tax-exempt portion",v:formatINR(Math.min(gratuity,taxExemptLimit)),c:GREEN},
                {l:"Taxable portion",v:formatINR(taxableGratuity),c:taxableGratuity>0?"#F59E0B":TEXT3},
              ].map(({l,v,c,bold},i)=>(
                <tr key={i} style={{borderBottom:`1px solid #F2F0EB`,background:bold?"#FAF8F5":"transparent"}}>
                  <td style={{padding:"7px 10px",color:TEXT2,fontWeight:bold?600:400}}>{l}</td>
                  <td className="num" style={{padding:"7px 10px",textAlign:"right",color:c,fontWeight:bold?700:400}}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {yearData.length>0&&(
          <div className="card">
            <div style={{fontWeight:700,fontSize:14,color:"#1A1714",marginBottom:4}}>Gratuity Growth to Retirement</div>
            <div style={{fontSize:11,color:TEXT3,marginBottom:14}}>At {salaryHike}% annual salary hike · capped at ₹20L</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={yearData} margin={{top:4,right:16,left:0,bottom:0}}>
                <defs><linearGradient id="gg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACC} stopOpacity={0.25}/><stop offset="95%" stopColor={ACC} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
                <XAxis dataKey="age" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={<ChartTooltip labelPrefix="Age "/>}/>
                <Area type="monotone" dataKey="gratuity" name="Gratuity" stroke={ACC} strokeWidth={2.5} fill="url(#gg1)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GOAL PLANNER ─────────────────────────────────────────────────────────────
function GoalSeekPage(){
  const GOAL_PRESETS=[
    {name:"Child Education",inflation:10,color:PURP},
    {name:"House Down Payment",inflation:7,color:BLUE},
    {name:"Car",inflation:5,color:"#F59E0B"},
    {name:"Retirement",inflation:6,color:ACC},
    {name:"Vacation",inflation:5,color:"#EC4899"},
    {name:"Wedding",inflation:7,color:"#F97316"},
    {name:"Emergency Fund",inflation:6,color:"#60A5FA"},
    {name:"Business",inflation:6,color:GREEN},
    {name:"Custom",inflation:6,color:TEXT2},
  ];
  const recRate=(years)=>{
    if(years<=3)return{rate:7,label:"Conservative (Debt)",color:BLUE};
    if(years<=5)return{rate:10,label:"Moderate (Hybrid)",color:"#F59E0B"};
    if(years<=7)return{rate:12,label:"Aggressive (Equity)",color:ACC};
    return{rate:14,label:"Very Aggressive (Small/Mid)",color:PURP};
  };
  const makeGoal=(id)=>({id,name:"Child Education",presentValue:1000000,years:10,inflation:10,returnRate:recRate(10).rate,color:PURP,active:true});
  const [goals,setGoals]=React.useState([makeGoal(1),makeGoal(2)]);
  const [nextId,setNextId]=React.useState(3);
  const addGoal=()=>{if(goals.filter(g=>g.active).length>=10)return;const id=nextId;setNextId(id+1);setGoals(prev=>[...prev,{...makeGoal(id),name:"New Goal",presentValue:500000,years:5,inflation:6,returnRate:10,color:TEXT2}]);};
  const removeGoal=(id)=>setGoals(prev=>prev.filter(g=>g.id!==id));
  const updateGoal=(id,field,value)=>setGoals(prev=>prev.map(g=>{if(g.id!==id)return g;const updated={...g,[field]:value};if(field==="years")updated.returnRate=recRate(value).rate;return updated;}));
  const activeGoals=goals.filter(g=>g.active);
  const isCustomRate=g=>g.returnRate!==recRate(g.years).rate;

  const goalCalcs=activeGoals.map(g=>{
    const fv=g.presentValue*Math.pow(1+g.inflation/100,g.years);
    const mr=Math.pow(1+g.returnRate/100,1/12)-1,n=g.years*12;
    const sip=mr>0?fv*mr/((Math.pow(1+mr,n)-1)*(1+mr)):fv/n;
    const yearData=[];
    for(let y=1;y<=g.years;y++){const m=y*12;const c=sip*(Math.pow(1+mr,m)-1)/mr*(1+mr);yearData.push({year:y,corpus:Math.round(c)});}
    const rec=recRate(g.years);
    return{...g,fv:Math.round(fv),sip:Math.round(sip),yearData,rec,totalInvested:Math.round(sip*n),gain:Math.round(fv-sip*n)};
  });

  const totalMonthlySIP=goalCalcs.reduce((s,g)=>s+g.sip,0);
  const totalFV=goalCalcs.reduce((s,g)=>s+g.fv,0);
  const maxYears=Math.max(...activeGoals.map(g=>g.years),1);
  const combinedData=[];
  for(let y=1;y<=maxYears;y++){
    const row={year:y};
    goalCalcs.forEach(g=>{if(y<=g.years){const mr=Math.pow(1+g.returnRate/100,1/12)-1,m=y*12;const c=g.sip*(Math.pow(1+mr,m)-1)/mr*(1+mr);row[`goal_${g.id}`]=Math.round(c);}});
    combinedData.push(row);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* GOAL CARDS */}
      {goalCalcs.map((g,idx)=>(
        <div key={g.id} className="card" style={{padding:"22px 24px",borderColor:g.color+"40"}}>

          {/* Header row: Goal label + dropdown + delete */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
            <div style={{fontSize:13,fontWeight:700,color:g.color,letterSpacing:"0.5px",minWidth:56}}>Goal {idx+1}</div>
            <select value={g.name}
              onChange={e=>{const preset=GOAL_PRESETS.find(p=>p.name===e.target.value)||GOAL_PRESETS[8];setGoals(prev=>prev.map(pg=>pg.id===g.id?{...pg,name:e.target.value,inflation:preset.inflation,color:preset.color}:pg));}}
              style={{flex:1,maxWidth:260,background:"#FAF8F5",border:`1.5px solid ${g.color}50`,borderRadius:8,color:g.color,padding:"9px 12px",fontSize:14,outline:"none",fontWeight:700}}>
              {GOAL_PRESETS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            {activeGoals.length>1&&(
              <div onClick={()=>removeGoal(g.id)}
                style={{marginLeft:"auto",width:30,height:30,borderRadius:7,background:"#FDEAEA",border:`1px solid ${RED}40`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:RED,flexShrink:0}}>×</div>
            )}
          </div>

          {/* Input fields row */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,marginBottom:16,alignItems:"start"}}>
            <div>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Present Value</div>
              <div style={{display:"flex",alignItems:"center",background:"#ffffff",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden"}}>
                <span style={{padding:"0 10px",color:g.color,fontFamily:"'DM Mono',monospace",fontWeight:600,fontSize:13,borderRight:`1px solid ${BORDER}`,alignSelf:"stretch",display:"flex",alignItems:"center",background:"#FAF8F5"}}>₹</span>
                <ClearableInput value={g.presentValue} onChange={v=>updateGoal(g.id,"presentValue",v)} step={50000} min={0} color="#1A1714"
                  style={{flex:1,background:"transparent",border:"none",padding:"8px 10px",fontSize:14,fontFamily:"'DM Mono',monospace",fontWeight:500,outline:"none",minWidth:0}}/>
                {g.presentValue>=100000&&<span style={{padding:"0 8px",fontSize:11,color:g.color,fontWeight:700,whiteSpace:"nowrap",fontFamily:"'DM Mono',monospace"}}>
                  {g.presentValue>=10000000?`${(g.presentValue/10000000).toFixed(2)}Cr`:g.presentValue>=100000?`${(g.presentValue/100000).toFixed(2)}L`:""}
                </span>}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Timeline</div>
              <div style={{display:"flex",alignItems:"center",background:"#ffffff",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden"}}>
                <ClearableInput value={g.years} onChange={v=>updateGoal(g.id,"years",Math.max(1,v))} step={1} min={1} color="#1A1714" isInt={true}
                  style={{flex:1,background:"transparent",border:"none",padding:"8px 10px",fontSize:14,fontFamily:"'DM Mono',monospace",fontWeight:500,outline:"none",minWidth:0}}/>
                <span style={{padding:"0 8px",fontSize:11,color:TEXT3,whiteSpace:"nowrap"}}>yrs</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Inflation</div>
              <div style={{display:"flex",alignItems:"center",background:"#ffffff",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden"}}>
                <ClearableInput value={g.inflation} onChange={v=>updateGoal(g.id,"inflation",v)} step={0.5} min={0} color="#1A1714"
                  style={{flex:1,background:"transparent",border:"none",padding:"8px 10px",fontSize:14,fontFamily:"'DM Mono',monospace",fontWeight:500,outline:"none",minWidth:0}}/>
                <span style={{padding:"0 8px",fontSize:11,color:TEXT3}}>%</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                Rate of Return
                {!isCustomRate(g)&&<span style={{fontSize:9,color:g.rec.color,background:g.rec.color+"20",padding:"2px 6px",borderRadius:4,fontWeight:700}}>AUTO</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",background:"#ffffff",border:`1.5px solid ${BORDER}`,borderRadius:8,overflow:"hidden"}}>
                <ClearableInput value={g.returnRate} onChange={v=>updateGoal(g.id,"returnRate",v)} step={0.5} min={1} color={isCustomRate(g)?"#F59E0B":g.rec.color}
                  style={{flex:1,background:"transparent",border:"none",padding:"8px 10px",fontSize:14,fontFamily:"'DM Mono',monospace",fontWeight:600,outline:"none",minWidth:0}}/>
                <span style={{padding:"0 8px",fontSize:11,color:TEXT3}}>%</span>
              </div>
              {!isCustomRate(g)&&<div style={{fontSize:11,color:TEXT3,marginTop:4}}>{g.rec.label}</div>}
            </div>
          </div>

          {/* Divider */}
          <div style={{height:1,background:BORDER,marginBottom:14}}/>

          {/* Results row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
            {[
              ["Future Value",formatINR(g.fv),g.color],
              ["Inflation Impact",`+${formatINR(g.fv-g.presentValue)}`,"#D97706"],
              ["Monthly SIP",formatINR(g.sip),ACC],
              ["Total to Invest",formatINR(g.totalInvested),TEXT2],
              ["Wealth Gain",formatINR(g.gain),GREEN],
              ["CAGR",`${g.returnRate}%`,g.rec.color],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:"#F7F5F0",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:TEXT3,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.8px",fontWeight:700}}>{l}</div>
                <div className="num" style={{fontWeight:700,fontSize:14,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ADD GOAL */}
      {activeGoals.length<10&&(
        <div onClick={addGoal}
          style={{border:`2px dashed ${BORDER}`,borderRadius:12,padding:"16px",textAlign:"center",cursor:"pointer",color:TEXT3,fontSize:13,transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=ACC;e.currentTarget.style.color=ACC;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=TEXT3;}}>
          + Add Goal ({activeGoals.length}/10)
        </div>
      )}

      {/* COMBINED RESULTS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[
          {l:"Goals Defined",v:`${activeGoals.length} / 10`,c:TEXT2,bg:"#ffffff",bc:BORDER},
          {l:"Total Future Value",v:formatINR(totalFV),c:"#D97706",bg:"#FFFBEB",bc:"#F59E0B40"},
          {l:"Combined Monthly SIP",v:formatINR(totalMonthlySIP),c:ACC,bg:"#FFFBF2",bc:ACC+"50"},
        ].map(({l,v,c,bg,bc})=>(
          <div key={l} style={{background:bg,border:`1.5px solid ${bc}`,borderRadius:14,padding:"20px 22px"}}>
            <div style={{fontSize:12,color:TEXT2,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{l}</div>
            <div className="num" style={{fontWeight:700,fontSize:"clamp(22px,2.2vw,32px)",color:c,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>

      {/* SIP BREAKDOWN BANNER */}
      <div style={{background:"#FFFBF2",border:`1.5px solid ${ACC}50`,borderRadius:14,padding:"24px 28px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontSize:12,color:ACC,letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Start Investing Today</div>
          <div className="num" style={{fontWeight:700,fontSize:"clamp(28px,4vw,44px)",color:ACC,lineHeight:1}}>{formatINR(totalMonthlySIP)}</div>
          <div style={{fontSize:13,color:TEXT2,marginTop:8}}>per month across all {activeGoals.length} goals</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10,minWidth:200}}>
          {goalCalcs.map(g=>(
            <div key={g.id} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:2,background:g.color,flexShrink:0}}/>
              <div style={{fontSize:13,color:TEXT2,flex:1}}>{g.name}</div>
              <div className="num" style={{fontSize:13,color:g.color,fontWeight:600,marginRight:8}}>{formatINR(g.sip)}/mo</div>
              <div style={{width:80,height:5,background:BORDER,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(g.sip/totalMonthlySIP*100).toFixed(0)}%`,background:g.color,borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:TEXT3,width:32,textAlign:"right"}}>{(g.sip/totalMonthlySIP*100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* CHART */}
      {combinedData.length>0&&(
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:"#1A1714",marginBottom:14}}>Corpus Building — All Goals</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedData} margin={{top:4,right:16,left:0,bottom:0}}>
              <defs>{goalCalcs.map(g=><linearGradient key={g.id} id={`gcg${g.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={g.color} stopOpacity={0.3}/><stop offset="95%" stopColor={g.color} stopOpacity={0}/></linearGradient>)}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
              <XAxis dataKey="year" tick={{fill:TEXT3,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>formatINR(v)} tick={{fill:TEXT3,fontSize:9}} axisLine={false} tickLine={false} width={72}/>
              <Tooltip content={<ChartTooltip labelPrefix="Year "/>}/><Legend wrapperStyle={{fontSize:11}} formatter={val=>{const g=goalCalcs.find(g=>`goal_${g.id}`===val);return g?g.name:val;}}/>
              {goalCalcs.map(g=><Area key={g.id} type="monotone" dataKey={`goal_${g.id}`} name={`goal_${g.id}`} stroke={g.color} strokeWidth={2} fill={`url(#gcg${g.id})`} connectNulls={false}/>)}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({setPage}){
  const CALCULATORS=[
    {id:"calculator",icon:"🧮",label:"Lumpsum & SIP",color:ACC,bgColor:"#FFFBF2",desc:"Corpus growth calculator with step-up SIP, XIRR and target corpus finder",tags:["Lumpsum","SIP","Step-Up","Target SIP"]},
    {id:"emi",icon:"🏦",label:"EMI Calculator",color:"#D97706",bgColor:"#FFFBEB",desc:"Home, car, personal & education loans with full amortization schedule",tags:["Home Loan","Car Loan","Amortization"]},
    {id:"retirement",icon:"🌅",label:"Retirement Planner",color:PURP,bgColor:"#F0EAFA",desc:"Plan check, find required SIP, or discover your earliest retirement age",tags:["Plan Check","SIP Needed","Retire When"]},
    {id:"car",icon:"🚗",label:"Car Affordability",color:BLUE,bgColor:"#E8F0FA",desc:"Is that car within budget? Or discover exactly what car you can afford",tags:["Affordability","EMI Gauge","Running Cost"]},
    {id:"house",icon:"🏠",label:"House Affordability",color:GREEN,bgColor:"#EAF5EE",desc:"Home budget calculator with rent vs buy crossover analysis",tags:["Affordability","Rent vs Buy","Crossover"]},
    {id:"gratuity",icon:"🎁",label:"Gratuity",color:"#F97316",bgColor:"#FFF0E6",desc:"Gratuity eligibility, tax exemption calculation and retirement projection",tags:["Eligibility","Tax Exempt","Act 1972"]},
    {id:"goalseek",icon:"🎯",label:"Goal Planner",color:"#9333EA",bgColor:"#F5F0FF",desc:"Plan up to 5 financial goals — get monthly SIP needed and combined total",tags:["Goals","SIP","Future Value"]},
  ];

  const COMING_SOON=[
    {icon:"📈",label:"Index SIPs",desc:"Nifty 50, Midcap 150, Smallcap 250 SIP return tracker"},
    {icon:"🏢",label:"Stock SIPs",desc:"Individual stock SIP performance & XIRR calculator"},
    {icon:"🌍",label:"Global Indices",desc:"S&P 500, Nasdaq and global market SIP calculator"},
    {icon:"💼",label:"Networth Calculator",desc:"Track all your assets & liabilities in one dashboard"},
    {icon:"⚖️",label:"Portfolio Allocator",desc:"Optimal asset allocation by age and risk profile"},
    {icon:"🏛️",label:"PPF Calculator",desc:"PPF maturity, partial withdrawal and loan planning"},
  ];

  return(
    <div style={{maxWidth:1400,margin:"0 auto"}}>
      {/* Hero */}
      <div style={{padding:"64px 32px 48px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:1000,height:400,background:"radial-gradient(ellipse at 50% 0%,rgba(193,127,36,0.07) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:640,margin:"0 auto"}}>
          <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:900,fontSize:"clamp(40px,6vw,84px)",letterSpacing:"-3px",lineHeight:1.0,marginBottom:20,color:"#1A1714",textAlign:"center"}}>
            Your Money, <span style={{background:`linear-gradient(135deg,${ACC_D} 0%,${ACC} 60%,#E8A830 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Clearly.</span>
          </h1>
          <p style={{fontSize:"clamp(17px,1.6vw,22px)",color:TEXT2,lineHeight:1.6}}>
            The metrics behind your wealth, simplified.
          </p>
        </div>
      </div>

      <div style={{padding:"0 32px 60px"}}>
        {/* Section header — Live */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:TEXT2,letterSpacing:"0.5px",textTransform:"uppercase",whiteSpace:"nowrap"}}>Live Calculators</div>
          <div style={{flex:1,height:1,background:BORDER}}/>
          <div style={{fontSize:12,color:TEXT2,background:"#ffffff",border:`1px solid ${BORDER}`,padding:"3px 12px",borderRadius:8,fontWeight:600,whiteSpace:"nowrap"}}>{CALCULATORS.length} tools</div>
        </div>

        {/* Calculator cards grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16,marginBottom:52}}>
          {CALCULATORS.map(t=>(
            <div key={t.id} onClick={()=>setPage(t.id)}
              style={{background:"#ffffff",border:`1px solid ${BORDER}`,borderRadius:18,padding:"28px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color+"60";e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 40px rgba(26,23,20,0.09)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",bottom:-8,right:-4,fontSize:100,opacity:0.04,lineHeight:1,pointerEvents:"none",userSelect:"none"}}>{t.icon}</div>
              <div style={{width:52,height:52,borderRadius:14,background:t.bgColor,border:`1px solid ${t.color}28`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:16}}>{t.icon}</div>
              <div style={{fontWeight:700,fontSize:18,color:"#1A1714",marginBottom:8}}>{t.label}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.7,marginBottom:16}}>{t.desc}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
                {t.tags.map(tag=><span key={tag} style={{fontSize:11,color:TEXT2,background:"#F2F0EB",border:`1px solid ${BORDER}`,borderRadius:6,padding:"3px 9px",fontWeight:500}}>{tag}</span>)}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:13,color:t.color,fontWeight:700}}>Open calculator <span style={{fontSize:16}}>→</span></div>
            </div>
          ))}
        </div>

        {/* Section divider — Coming Soon */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:TEXT2,letterSpacing:"0.5px",textTransform:"uppercase",whiteSpace:"nowrap"}}>Coming Soon</div>
          <div style={{flex:1,height:1,background:BORDER}}/>
          <div style={{fontSize:11,fontWeight:700,color:ACC,background:"#FFFBF2",border:`1px solid ${ACC}40`,padding:"3px 12px",borderRadius:20,whiteSpace:"nowrap"}}>In development</div>
        </div>

        {/* Coming Soon section */}
        <div style={{background:"#F2F0EB",border:`1px solid ${BORDER}`,borderRadius:18,padding:"28px",marginBottom:32}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {COMING_SOON.map(t=>(
              <div key={t.label} style={{background:"#ffffff",border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:14,opacity:0.8}}>
                <div style={{width:40,height:40,borderRadius:10,background:"#F2F0EB",border:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{t.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1A1714"}}>{t.label}</div>
                    <div style={{fontSize:10,fontWeight:700,color:TEXT3,background:"#E4E0D8",padding:"2px 7px",borderRadius:10,letterSpacing:"0.3px"}}>SOON</div>
                  </div>
                  <div style={{fontSize:12,color:TEXT3,lineHeight:1.5}}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{padding:"10px 16px",background:"#F2F0EB",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:11,color:TEXT3,lineHeight:1.7}}>
          <strong style={{color:ACC}}>Disclaimer:</strong> All calculations are indicative and for educational purposes only. Market return data is illustrative. Not financial advice.
        </div>
      </div>
    </div>
  );
}

// ─── PAGES CONFIG ─────────────────────────────────────────────────────────────
const PAGES=[
  {id:"home",       label:"Home",             icon:"⌂"},
  {id:"calculator", label:"Lumpsum & SIP",    icon:"🧮"},
  {id:"emi",        label:"EMI",              icon:"🏦"},
  {id:"retirement", label:"Retirement",       icon:"🌅"},
  {id:"car",        label:"Car Affordability",icon:"🚗"},
  {id:"house",      label:"House Affordability",icon:"🏠"},
  {id:"gratuity",   label:"Gratuity",         icon:"🎁"},
  {id:"goalseek",   label:"Goal Planner",     icon:"🎯"},
];

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("home");

  return(
    <div style={{minHeight:"100vh",background:"#F7F5F0",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#1A1714"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Nav */}
      <div style={{background:"#ffffff",borderBottom:`1px solid ${BORDER}`,boxShadow:`0 1px 0 ${BORDER},0 4px 16px rgba(26,23,20,0.05)`,padding:"14px 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{marginRight:16,flexShrink:0,cursor:"pointer"}} onClick={()=>setPage("home")}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:900,color:ACC,letterSpacing:"-0.5px",lineHeight:1}}>WealthMetric</div>
            <div style={{fontSize:10,color:TEXT3,letterSpacing:"2px",textTransform:"uppercase",marginTop:3}}>Personal Finance</div>
          </div>
          {PAGES.filter(p=>p.id!=="home").map(p=>(
            <div key={p.id} className={`nav-tab ${page===p.id?"active":"inactive"}`} onClick={()=>setPage(p.id)}>
              <span>{p.icon}</span><span>{p.label}</span>
            </div>
          ))}
        </div>
      </div>



      {/* Content */}
      <div style={{...(page!=="home"?{maxWidth:1400,margin:"0 auto",padding:"20px 16px"}:{})}}>
        {page==="home"       &&<HomePage setPage={setPage}/>}
        {page==="calculator" &&<CalculatorPage/>}
        {page==="emi"        &&<EMIPage/>}
        {page==="retirement" &&<RetirementPage/>}
        {page==="car"        &&<CarPage/>}
        {page==="house"      &&<HousePage/>}
        {page==="gratuity"   &&<GratuityPage/>}
        {page==="goalseek"   &&<GoalSeekPage/>}
      </div>
    </div>
  );
}
