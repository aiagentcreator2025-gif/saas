import { useState } from "react";
import {
  TrendingUp, TrendingDown, Users, Mail, CalendarCheck, CheckSquare,
  ChevronDown, ArrowUpRight, CalendarDays,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = ["2019","2020","2021","2022","2023","2024"];

const WEEKLY_DATA = [
  { leadsHandled:28, magnetSent:18, bookedCalls:8,  showUp:4  },
  { leadsHandled:42, magnetSent:28, bookedCalls:12, showUp:6  },
  { leadsHandled:32, magnetSent:20, bookedCalls:9,  showUp:5  },
  { leadsHandled:58, magnetSent:38, bookedCalls:16, showUp:9  },
  { leadsHandled:46, magnetSent:30, bookedCalls:13, showUp:7  },
  { leadsHandled:72, magnetSent:48, bookedCalls:21, showUp:12 },
  { leadsHandled:54, magnetSent:36, bookedCalls:15, showUp:8  },
];
const MONTHLY_DATA = [
  { leadsHandled:120, magnetSent:80,  bookedCalls:34, showUp:20 },
  { leadsHandled:98,  magnetSent:65,  bookedCalls:27, showUp:16 },
  { leadsHandled:135, magnetSent:90,  bookedCalls:38, showUp:22 },
  { leadsHandled:142, magnetSent:98,  bookedCalls:34, showUp:24 },
  { leadsHandled:108, magnetSent:72,  bookedCalls:29, showUp:17 },
  { leadsHandled:160, magnetSent:107, bookedCalls:43, showUp:26 },
  { leadsHandled:128, magnetSent:85,  bookedCalls:32, showUp:19 },
  { leadsHandled:175, magnetSent:117, bookedCalls:47, showUp:28 },
  { leadsHandled:148, magnetSent:99,  bookedCalls:38, showUp:23 },
  { leadsHandled:165, magnetSent:110, bookedCalls:42, showUp:25 },
  { leadsHandled:190, magnetSent:127, bookedCalls:51, showUp:30 },
  { leadsHandled:172, magnetSent:115, bookedCalls:46, showUp:27 },
];
const YEARLY_DATA = [
  { leadsHandled:820,  magnetSent:548,  bookedCalls:197, showUp:118 },
  { leadsHandled:940,  magnetSent:628,  bookedCalls:226, showUp:135 },
  { leadsHandled:1100, magnetSent:735,  bookedCalls:264, showUp:158 },
  { leadsHandled:1280, magnetSent:855,  bookedCalls:307, showUp:184 },
  { leadsHandled:1050, magnetSent:701,  bookedCalls:252, showUp:151 },
  { leadsHandled:1400, magnetSent:935,  bookedCalls:336, showUp:201 },
];

type DataRow = { leadsHandled: number; magnetSent: number; bookedCalls: number; showUp: number };

const ACTIVITIES = [
  { init:"AK", name:"Ahmed Karimi",  action:"booked a call",        time:"2 min ago",   bg:"#EEF2FF", color:"#4F46E5" },
  { init:"SM", name:"Sara Moreira",  action:"received lead magnet", time:"15 min ago",  bg:"#DCFCE7", color:"#16A34A" },
  { init:"JD", name:"John Davidson", action:"booked a call",        time:"1 hour ago",  bg:"#EEF2FF", color:"#4F46E5" },
  { init:"MS", name:"Maria Santos",  action:"entered the flow",     time:"2 hours ago", bg:"#DBEAFE", color:"#2563EB" },
  { init:"CL", name:"Chris Lee",     action:"no-showed the call",   time:"3 hours ago", bg:"#FEE2E2", color:"#DC2626" },
];

const BASE = "https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/";

const AGENT_IMAGES: Record<string, string> = {
  "Booking Flow":         `${BASE}facebooking1.png`,
  "Follow-Up Automation": `${BASE}facefollowupautomation.png`,
  "Follow-Up Agent":      `${BASE}facefollowupagent.png`,
};

// ─── SVG Step Icons (unchanged) ───────────────────────────────────────────────
function IconTrigger({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <polygon points="25,8 15,24 22,24 19,36 29,20 22,20" fill={color} opacity="0.9"/>
    </svg>
  );
}
function IconScript({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <rect x="9" y="12" width="24" height="16" rx="4" fill={color} opacity="0.85"/>
      <polygon points="13,28 9,35 20,28" fill={color} opacity="0.85"/>
      <rect x="13" y="17" width="14" height="2" rx="1" fill="white" opacity="0.8"/>
      <rect x="13" y="21" width="10" height="2" rx="1" fill="white" opacity="0.6"/>
    </svg>
  );
}
function IconLeadMagnet({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <rect x="11" y="8" width="18" height="24" rx="3" fill={color} opacity="0.85"/>
      <path d="M23 8 L29 14 L23 14 Z" fill="white" opacity="0.45"/>
      <rect x="14" y="18" width="10" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <rect x="14" y="21" width="8"  height="1.5" rx="0.75" fill="white" opacity="0.5"/>
      <rect x="14" y="24" width="10" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
      <circle cx="30" cy="32" r="7" fill={color}/>
      <path d="M30 28.5 L30 33 M27.5 31 L30 33.5 L32.5 31" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconFollowUp({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <path d="M13 22 A9 9 0 1 1 22 31" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <polygon points="13,17.5 13,25.5 19.5,22" fill={color}/>
      <circle cx="30" cy="14" r="6" fill={color} opacity="0.9"/>
      <path d="M30 11 L30 14 L33 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconBooking({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <rect x="9" y="13" width="26" height="22" rx="3" fill={color} opacity="0.85"/>
      <rect x="9" y="13" width="26" height="8"  rx="3" fill={color}/>
      <rect x="15" y="9" width="2.5" height="7" rx="1.25" fill={color}/>
      <rect x="27" y="9" width="2.5" height="7" rx="1.25" fill={color}/>
      <path d="M16 27 L21 32 L28 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconScheduledTrigger({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <circle cx="22" cy="22" r="13" fill={color} opacity="0.85"/>
      <path d="M22 14 L22 22 L28 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="22" r="1.8" fill="white"/>
    </svg>
  );
}
function IconFollowUpMsg({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <rect x="8" y="14" width="22" height="15" rx="3" fill={color} opacity="0.85"/>
      <path d="M8 17 L19 24 L30 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="33" cy="30" r="6" fill={color}/>
      <path d="M30 30 L35 30 M33 27.5 L35 30 L33 32.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconIngestAgent({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <rect x="12" y="15" width="20" height="15" rx="5" fill={color} opacity="0.9"/>
      <circle cx="18" cy="21" r="2.2" fill="white"/>
      <circle cx="26" cy="21" r="2.2" fill="white"/>
      <circle cx="18.9" cy="21" r="1" fill={color}/>
      <circle cx="26.9" cy="21" r="1" fill={color}/>
      <line x1="22" y1="15" x2="22" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="8" r="2.5" fill={color}/>
      <path d="M17.5 26.5 Q22 30 26.5 26.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function IconAgentReply({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="22" fill={color + "18"}/>
      <rect x="7" y="11" width="18" height="11" rx="3" fill={color} opacity="0.5"/>
      <polygon points="11,22 7,28 17,22" fill={color} opacity="0.5"/>
      <rect x="17" y="23" width="20" height="11" rx="3" fill={color} opacity="0.95"/>
      <polygon points="33,34 37,40 23,34" fill={color} opacity="0.95"/>
      <circle cx="22" cy="28.5" r="1.3" fill="white"/>
      <circle cx="27" cy="28.5" r="1.3" fill="white"/>
      <circle cx="32" cy="28.5" r="1.3" fill="white"/>
    </svg>
  );
}

function StepIllustration({ label, color }: { label: string; color: string }) {
  const map: Record<string, JSX.Element> = {
    "Trigger":           <IconTrigger color={color}/>,
    "Script 1":          <IconScript color={color}/>,
    "Script 2":          <IconFollowUp color={color}/>,
    "Lead Magnet":       <IconLeadMagnet color={color}/>,
    "Booking":           <IconBooking color={color}/>,
    "Scheduled Trigger": <IconScheduledTrigger color={color}/>,
    "Follow-Up Message": <IconFollowUpMsg color={color}/>,
    "Ingest Agent":      <IconIngestAgent color={color}/>,
    "Agent Reply":       <IconAgentReply color={color}/>,
  };
  return map[label] ?? <IconTrigger color={color}/>;
}

// ─── Flow data ────────────────────────────────────────────────────────────────
const FLOWS = [
  {
    title: "Booking Flow",
    subtitle: "Your main automation pipeline",
    conversion: { label: "24% (34/142)", pct: 24 },
    steps: [
      { label:"Trigger",     sub:"WhatsApp",  count:"142", color:"#4F46E5", bg:"#EEF2FF" },
      { label:"Script 1",    sub:"Welcome",   count:"138", color:"#2563EB", bg:"#DBEAFE" },
      { label:"Lead Magnet", sub:"Send PDF",  count:"98",  color:"#16A34A", bg:"#DCFCE7" },
      { label:"Script 2",    sub:"Follow-up", count:"61",  color:"#D97706", bg:"#FEF3C7" },
      { label:"Booking",     sub:"Schedule",  count:"34",  color:"#7C3AED", bg:"#EDE9FE" },
    ],
  },
  {
    title: "Follow-Up Automation",
    subtitle: "Re-engage no-shows automatically",
    conversion: { label: "82% (72/87)", pct: 82 },
    steps: [
      { label:"Scheduled Trigger", sub:"Trigger", count:"87", color:"#4F46E5", bg:"#EEF2FF" },
      { label:"Follow-Up Message", sub:"Message", count:"72", color:"#2563EB", bg:"#DBEAFE" },
    ],
  },
  {
    title: "Follow-Up Agent",
    subtitle: "AI agent handles responses",
    conversion: { label: "88% (48/54)", pct: 88 },
    steps: [
      { label:"Ingest Agent", sub:"Agent",      count:"54", color:"#DC2626", bg:"#FEE2E2" },
      { label:"Agent Reply",  sub:"Auto reply", count:"48", color:"#16A34A", bg:"#DCFCE7" },
    ],
  },
];

type FlowStep = typeof FLOWS[0]["steps"][0];
type Flow = typeof FLOWS[0];

// ─── Glass card helper ────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(99,102,241,0.08), 0 1px 2px rgba(255,255,255,0.9) inset",
};

const glassDark = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.75)",
  boxShadow: "0 8px 32px rgba(99,102,241,0.12), 0 1px 2px rgba(255,255,255,0.8) inset",
};

// ─── Agent Avatar ─────────────────────────────────────────────────────────────
function AgentAvatar({ flowTitle }: { flowTitle: string }) {
  const src = AGENT_IMAGES[flowTitle];
  return (
    <div style={{
      width:52, height:52, borderRadius:"50%", overflow:"hidden",
      border:"2.5px solid rgba(255,255,255,0.9)",
      boxShadow:"0 4px 14px rgba(79,70,229,.22), 0 0 0 4px rgba(79,70,229,.08)",
      background:"#EEF2FF", flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <img src={src} alt={flowTitle}
        style={{ width:"100%", height:"100%", objectFit:"cover" }}
        onError={e => { (e.target as HTMLImageElement).style.display="none"; }}
      />
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart() {
  const segs = [
    { label:"Leads Handled",    value:142, color:"#4F46E5", pct:0.52 },
    { label:"Lead Magnet Sent", value:98,  color:"#818CF8", pct:0.20 },
    { label:"Booked Calls",     value:34,  color:"#C7D2FE", pct:0.16 },
    { label:"Show Up Rate",     value:27,  color:"#E0E7FF", pct:0.12 },
  ];
  const cx=80, cy=80, r1=62, r2=40;
  let cum=-Math.PI/2;
  function arc(pct: number) {
    const s=cum, e=cum+pct*2*Math.PI-0.03; cum=e+0.03;
    const x1s=cx+r1*Math.cos(s), y1s=cy+r1*Math.sin(s);
    const x1e=cx+r1*Math.cos(e), y1e=cy+r1*Math.sin(e);
    const x2s=cx+r2*Math.cos(e), y2s=cy+r2*Math.sin(e);
    const x2e=cx+r2*Math.cos(s), y2e=cy+r2*Math.sin(s);
    const lg=pct>0.5?1:0;
    return `M${x1s} ${y1s}A${r1} ${r1} 0 ${lg} 1 ${x1e} ${y1e}L${x2s} ${y2s}A${r2} ${r2} 0 ${lg} 0 ${x2e} ${y2e}Z`;
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:20}}>
      <div style={{flexShrink:0,filter:"drop-shadow(0 4px 12px rgba(79,70,229,0.2))"}}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          <defs>
            <radialGradient id="donutGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.15)"/>
              <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={75} fill="url(#donutGlow)"/>
          {segs.map((s,i)=><path key={i} d={arc(s.pct)} fill={s.color}/>)}
          <circle cx={cx} cy={cy} r={32} fill="rgba(255,255,255,0.95)" style={{filter:"blur(0.5px)"}}/>
          <text x={cx} y={cy-6} textAnchor="middle" fontSize={14} fontWeight={800} fill="#111827" fontFamily="'Plus Jakarta Sans',sans-serif">301</text>
          <text x={cx} y={cy+9} textAnchor="middle" fontSize={9} fill="#9CA3AF" fontFamily="'Plus Jakarta Sans',sans-serif">Total</text>
        </svg>
      </div>
      <div style={{flex:1}}>
        {segs.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.color,boxShadow:`0 0 6px ${s.color}88`}}/>
              <span style={{fontSize:11,color:"#6B7280",fontWeight:500}}>{s.label}</span>
            </div>
            <span style={{fontSize:12,fontWeight:800,color:"#111827"}}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BubbleBarChart({ data, labels }: { data: DataRow[]; labels: string[] }) {
  const [tooltip, setTooltip] = useState<number|null>(null);
  const maxVal = Math.max(...data.map((d:DataRow) => d.leadsHandled));
  const BAR_H = 140;
  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:BAR_H+24}}>
        {data.map((entry:DataRow, i:number) => {
          const h1=Math.max(8,Math.round((entry.leadsHandled/maxVal)*BAR_H));
          const h2=Math.max(8,Math.round((entry.magnetSent/maxVal)*BAR_H));
          const hov=tooltip===i;
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",position:"relative"}}
              onMouseEnter={()=>setTooltip(i)} onMouseLeave={()=>setTooltip(null)}>
              {hov && (
                <div style={{
                  position:"absolute", bottom:h1+18, left:"50%", transform:"translateX(-50%)",
                  background:"rgba(17,24,39,0.92)", backdropFilter:"blur(12px)",
                  WebkitBackdropFilter:"blur(12px)",
                  color:"#fff", borderRadius:12, padding:"10px 14px",
                  fontSize:11, fontWeight:600, whiteSpace:"nowrap", zIndex:10,
                  boxShadow:"0 12px 32px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,0.1) inset",
                  border:"1px solid rgba(255,255,255,0.12)",
                  display:"flex", flexDirection:"column", gap:4,
                }}>
                  <span style={{color:"#818CF8"}}>● {entry.leadsHandled} Leads</span>
                  <span style={{color:"#C7D2FE"}}>● {entry.magnetSent} Magnets</span>
                  <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:0,height:0,
                    borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"5px solid rgba(17,24,39,0.92)"}}/>
                </div>
              )}
              <div style={{display:"flex",gap:3,alignItems:"flex-end",width:"100%"}}>
                <div style={{
                  flex:1, height:h1,
                  background: hov ? "linear-gradient(180deg,#6366F1,#4F46E5)" : "linear-gradient(180deg,#818CF8,#6366F1)",
                  borderRadius:"6px 6px 0 0", transition:"all .25s ease",
                  boxShadow: hov ? "0 4px 16px rgba(79,70,229,0.4)" : "none",
                }}/>
                <div style={{
                  flex:1, height:h2,
                  background: hov ? "linear-gradient(180deg,#C7D2FE,#A5B4FC)" : "linear-gradient(180deg,#E0E7FF,#C7D2FE)",
                  borderRadius:"6px 6px 0 0", transition:"all .25s ease",
                }}/>
              </div>
              <span style={{fontSize:9,color:"#9CA3AF",fontWeight:600}}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,borderRadius:2,background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}/>
          <span style={{fontSize:10,color:"#9CA3AF",fontWeight:500}}>Leads Handled</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,borderRadius:2,background:"linear-gradient(135deg,#E0E7FF,#C7D2FE)"}}/>
          <span style={{fontSize:10,color:"#9CA3AF",fontWeight:500}}>Lead Magnet Sent</span>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ init, bg="#EEF2FF", color="#4F46E5", size=30 }: { init:string; bg?:string; color?:string; size?:number }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.33,fontWeight:700,color,flexShrink:0,
      boxShadow:`0 2px 8px ${bg}88`}}>
      {init}
    </div>
  );
}

// ─── Flow Step Card ───────────────────────────────────────────────────────────
function FlowStepCard({ step }: { step: FlowStep }) {
  return (
    <div
      style={{
        textAlign:"center",
        background:"rgba(255,255,255,0.8)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        borderRadius:16,
        border:`1px solid ${step.color}22`,
        padding:"14px 10px",
        boxShadow:`0 4px 16px ${step.color}14, 0 1px 0 rgba(255,255,255,0.9) inset`,
        transition:"transform .2s ease, box-shadow .2s ease",
        cursor:"pointer",
      }}
      onMouseEnter={e=>{
        (e.currentTarget as HTMLElement).style.transform="translateY(-4px) scale(1.03)";
        (e.currentTarget as HTMLElement).style.boxShadow=`0 12px 32px ${step.color}28, 0 1px 0 rgba(255,255,255,0.9) inset`;
      }}
      onMouseLeave={e=>{
        (e.currentTarget as HTMLElement).style.transform="translateY(0) scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow=`0 4px 16px ${step.color}14, 0 1px 0 rgba(255,255,255,0.9) inset`;
      }}
    >
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
        <StepIllustration label={step.label} color={step.color}/>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"#111827",marginBottom:1}}>{step.label}</div>
      <div style={{fontSize:9,color:"#9CA3AF",marginBottom:8,fontWeight:500}}>{step.sub}</div>
      <div style={{fontSize:22,fontWeight:800,color:step.color,letterSpacing:"-0.5px"}}>{step.count}</div>
    </div>
  );
}

// ─── Flow Section ─────────────────────────────────────────────────────────────
function FlowSection({ flow }: { flow: Flow }) {
  return (
    <div style={{
      ...glassDark,
      borderRadius:20,
      padding:"22px 24px",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <AgentAvatar flowTitle={flow.title}/>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#111827",letterSpacing:"-0.3px",marginBottom:2}}>{flow.title}</div>
            <div style={{fontSize:11,color:"#6B7280",fontWeight:500}}>{flow.subtitle}</div>
          </div>
        </div>
        <button style={{
          padding:"8px 18px", borderRadius:10,
          border:"1.5px solid rgba(79,70,229,0.2)",
          background:"rgba(79,70,229,0.08)",
          backdropFilter:"blur(8px)",
          color:"#4F46E5", fontSize:11, fontWeight:700,
          cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
          transition:"all .2s ease",
        }}
          onMouseEnter={e=>{
            (e.currentTarget as HTMLElement).style.background="rgba(79,70,229,0.15)";
            (e.currentTarget as HTMLElement).style.transform="translateY(-1px)";
          }}
          onMouseLeave={e=>{
            (e.currentTarget as HTMLElement).style.background="rgba(79,70,229,0.08)";
            (e.currentTarget as HTMLElement).style.transform="translateY(0)";
          }}
        >Edit Flow</button>
      </div>

      <div style={{display:"flex",alignItems:"center"}}>
        {flow.steps.map((step:FlowStep, i:number) => (
          <div key={i} style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
            <div style={{flex:1}}><FlowStepCard step={step}/></div>
            {i < flow.steps.length-1 && (
              <div style={{padding:"0 4px",flexShrink:0}}>
                <svg width="14" height="8" viewBox="0 0 16 8">
                  <path d="M0 4h12M9 1l3 3-3 3" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop:14, display:"flex", alignItems:"center", gap:12,
        background:"rgba(255,255,255,0.5)",
        backdropFilter:"blur(8px)",
        borderRadius:12, padding:"10px 14px",
        border:"1px solid rgba(255,255,255,0.8)",
      }}>
        <span style={{fontSize:11,color:"#9CA3AF",flexShrink:0,fontWeight:500}}>Conversion rate</span>
        <div style={{flex:1,height:5,background:"rgba(229,231,235,0.8)",borderRadius:10,overflow:"hidden"}}>
          <div style={{
            height:"100%", width:`${flow.conversion.pct}%`,
            background:"linear-gradient(90deg,#4F46E5,#818CF8)",
            borderRadius:10,
            boxShadow:"0 0 8px rgba(79,70,229,0.4)",
          }}/>
        </div>
        <span style={{fontSize:12,fontWeight:800,color:"#111827",flexShrink:0}}>{flow.conversion.label}</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardScreen() {
  const [period, setPeriod] = useState("weekly");
  const chartData = period==="weekly"?WEEKLY_DATA:period==="monthly"?MONTHLY_DATA:YEARLY_DATA;
  const labels    = period==="weekly"?DAYS:period==="monthly"?MONTHS:YEARS;

  const hr = new Date().getHours();
  const greeting = hr<12?"morning":hr<18?"afternoon":"evening";
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  const stats = [
    { label:"Leads Handled",    sub:"vs last month", value:"142", change:"+18%", up:true,  color:"#4F46E5", Icon:Users        },
    { label:"Lead Magnet Sent", sub:"vs last month", value:"98",  change:"+12%", up:true,  color:"#2563EB", Icon:Mail          },
    { label:"Booked Calls",     sub:"vs last month", value:"34",  change:"-3%",  up:false, color:"#111827", Icon:CalendarCheck },
    { label:"Show Up Rate",     sub:"vs last month", value:"76%", change:"+5%",  up:true,  color:"#111827", Icon:CheckSquare   },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .stat-card { transition: transform .25s ease, box-shadow .25s ease; cursor: pointer; }
        .stat-card:hover { transform: translateY(-6px); }

        .per-btn { transition: all .15s; cursor: pointer; border: none; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C7D2FE; border-radius: 4px; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.5s ease 0.05s forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.5s ease 0.1s  forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.5s ease 0.15s forwards; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.5s ease 0.2s  forwards; opacity: 0; }
      `}</style>

      {/* ── MESH BACKGROUND ── */}
      <div style={{
        flex:1, overflowY:"auto", padding:"28px 28px 40px 24px",
        display:"flex", flexDirection:"column", gap:20,
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        position:"relative",
        background:`
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 10%,  rgba(139,92,246,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 90% 80%,  rgba(59,130,246,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 10% 90%,  rgba(99,102,241,0.06) 0%, transparent 55%),
          #EDEEF5
        `,
      }}>

        {/* ── Greeting ── */}
        <div className="fade-up">
          <h1 style={{fontSize:24,fontWeight:800,color:"#111827",letterSpacing:"-0.5px",marginBottom:3}}>
            Good {greeting} 👋
          </h1>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#9CA3AF",fontWeight:500}}>
            <CalendarDays size={12} strokeWidth={1.8}/>
            {today}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="fade-up-1" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {stats.map((s,i) => {
            const isDark = i===0;
            return (
              <div key={i} className="stat-card" style={{
                borderRadius:20, padding:"22px",
                background: isDark
                  ? "linear-gradient(135deg,#4F46E5 0%,#6366F1 50%,#818CF8 100%)"
                  : "rgba(255,255,255,0.75)",
                backdropFilter: isDark ? "none" : "blur(20px)",
                WebkitBackdropFilter: isDark ? "none" : "blur(20px)",
                border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.95)",
                boxShadow: isDark
                  ? "0 16px 48px rgba(79,70,229,0.45), 0 1px 0 rgba(255,255,255,0.2) inset"
                  : "0 4px 24px rgba(99,102,241,0.08), 0 1px 2px rgba(255,255,255,0.95) inset",
                position:"relative", overflow:"hidden",
              }}>
                {isDark && (
                  <>
                    <div style={{position:"absolute",top:-24,right:-24,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
                    <div style={{position:"absolute",bottom:-32,right:16,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
                    <div style={{position:"absolute",top:"50%",left:-20,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
                  </>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,position:"relative"}}>
                  <div style={{
                    width:38,height:38,borderRadius:11,
                    background: isDark ? "rgba(255,255,255,0.18)" : "linear-gradient(135deg,#EEF2FF,#E0E7FF)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.1)" : "0 2px 8px rgba(99,102,241,0.12)",
                  }}>
                    <s.Icon size={16} strokeWidth={1.8} color={isDark?"#fff":s.color}/>
                  </div>
                  <span style={{
                    fontSize:10,fontWeight:700,padding:"4px 9px",borderRadius:20,
                    color: s.up ? (isDark?"#fff":"#16A34A") : "#DC2626",
                    background: s.up ? (isDark?"rgba(255,255,255,0.18)":"#DCFCE7") : "#FEE2E2",
                    display:"flex",alignItems:"center",gap:3,
                    boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                  }}>
                    {s.up?<TrendingUp size={9} strokeWidth={2.5}/>:<TrendingDown size={9} strokeWidth={2.5}/>}
                    {s.change}
                  </span>
                </div>
                <div style={{fontSize:11,color:isDark?"rgba(255,255,255,0.7)":"#6B7280",fontWeight:600,marginBottom:5,position:"relative",letterSpacing:"0.2px"}}>{s.label}</div>
                <div style={{fontSize:32,fontWeight:800,color:isDark?"#fff":"#111827",letterSpacing:"-1.5px",lineHeight:1,marginBottom:5,position:"relative"}}>{s.value}</div>
                <div style={{fontSize:10,color:isDark?"rgba(255,255,255,0.45)":"#9CA3AF",position:"relative",fontWeight:500}}>{s.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ── Chart + Donut ── */}
        <div className="fade-up-2" style={{display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:16}}>

          <div style={{
            ...glass, borderRadius:20, padding:"22px 24px",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#111827",letterSpacing:"-0.3px",marginBottom:2}}>Lead Habits</div>
                <div style={{fontSize:11,color:"#9CA3AF",fontWeight:500}}>Track your lead flow performance</div>
              </div>
              <div style={{
                display:"flex",
                background:"rgba(243,244,246,0.8)",
                backdropFilter:"blur(8px)",
                borderRadius:10,padding:3,gap:1,
                border:"1px solid rgba(255,255,255,0.9)",
              }}>
                {["weekly","monthly","yearly"].map(p=>(
                  <button key={p} className="per-btn" onClick={()=>setPeriod(p)} style={{
                    padding:"5px 12px",borderRadius:8,fontSize:10,
                    fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,
                    background: period===p ? "#fff" : "transparent",
                    color: period===p ? "#111827" : "#9CA3AF",
                    boxShadow: period===p ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    transition:"all .2s ease",
                  }}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <BubbleBarChart data={chartData} labels={labels}/>
          </div>

          <div style={{...glass, borderRadius:20, padding:"22px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#111827",letterSpacing:"-0.3px",marginBottom:2}}>Flow Stats</div>
                <div style={{fontSize:11,color:"#9CA3AF",fontWeight:500}}>Track your flow metrics</div>
              </div>
              <div style={{
                display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9CA3AF",fontWeight:600,
                background:"rgba(249,250,251,0.8)",
                backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.9)",
                borderRadius:8,padding:"5px 10px",cursor:"pointer",
              }}>
                Today <ChevronDown size={10} strokeWidth={2}/>
              </div>
            </div>
            <DonutChart/>
            <div style={{
              marginTop:16,
              background:"rgba(249,250,251,0.7)",
              backdropFilter:"blur(8px)",
              borderRadius:12,padding:"12px 14px",
              border:"1px solid rgba(255,255,255,0.9)",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,color:"#9CA3AF",fontWeight:500}}>Conversion rate</span>
                <span style={{fontSize:12,fontWeight:800,color:"#4F46E5"}}>24%</span>
              </div>
              <div style={{height:5,background:"rgba(229,231,235,0.8)",borderRadius:10,overflow:"hidden"}}>
                <div style={{height:"100%",width:"24%",background:"linear-gradient(90deg,#4F46E5,#818CF8)",borderRadius:10,boxShadow:"0 0 8px rgba(79,70,229,0.4)"}}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── Booking Flow + Recent Activity ── */}
        <div className="fade-up-3" style={{display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:16}}>
          <FlowSection flow={FLOWS[0]}/>

          <div style={{...glass, borderRadius:20, padding:"22px 20px", display:"flex", flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <div style={{fontSize:15,fontWeight:800,color:"#111827",letterSpacing:"-0.3px"}}>Recent Activity</div>
              <div style={{
                display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9CA3AF",fontWeight:600,
                background:"rgba(249,250,251,0.8)", backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.9)",
                borderRadius:8,padding:"5px 10px",cursor:"pointer",
              }}>
                Today <ChevronDown size={10} strokeWidth={2}/>
              </div>
            </div>
            <div style={{fontSize:11,color:"#9CA3AF",marginBottom:16,fontWeight:500}}>All latest events</div>
            <div style={{flex:1}}>
              {ACTIVITIES.map((a,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",
                  borderBottom:i<ACTIVITIES.length-1?"1px solid rgba(243,244,246,0.8)":"none",
                  transition:"background .15s",
                }}>
                  <Avatar init={a.init} bg={a.bg} color={a.color} size={32}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:"#111827",lineHeight:1.5}}>
                      <span style={{fontWeight:700}}>{a.name}</span>{" "}
                      <span style={{color:"#6B7280"}}>{a.action}</span>
                    </div>
                    <div style={{fontSize:10,color:"#9CA3AF",marginTop:1,fontWeight:500}}>{a.time}</div>
                  </div>
                  <ArrowUpRight size={12} color="#D1D5DB" strokeWidth={2}/>
                </div>
              ))}
            </div>
            <button style={{
              width:"100%", marginTop:14, padding:"10px",
              borderRadius:12,
              background:"rgba(79,70,229,0.06)",
              backdropFilter:"blur(8px)",
              border:"1px solid rgba(79,70,229,0.15)",
              fontSize:11, fontWeight:700, color:"#4F46E5",
              cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
              transition:"all .2s ease",
            }}
              onMouseEnter={e=>{
                (e.currentTarget as HTMLElement).style.background="rgba(79,70,229,0.1)";
                (e.currentTarget as HTMLElement).style.transform="translateY(-1px)";
              }}
              onMouseLeave={e=>{
                (e.currentTarget as HTMLElement).style.background="rgba(79,70,229,0.06)";
                (e.currentTarget as HTMLElement).style.transform="translateY(0)";
              }}
            >
              View all activity
            </button>
          </div>
        </div>

        {/* ── Follow-Up flows ── */}
        <div className="fade-up-4" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <FlowSection flow={FLOWS[1]}/>
          <FlowSection flow={FLOWS[2]}/>
        </div>

      </div>
    </>
  );
}
