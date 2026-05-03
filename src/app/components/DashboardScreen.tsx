import { useState } from "react";
import {
  TrendingUp, ArrowUpRight, Clock, CheckSquare,
  Users, Mail, CalendarCheck, Zap, Phone, FileText,
  Search, Bell, ChevronDown, TrendingDown,
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

const LAYERS = [
  { key: "leadsHandled" as const, label: "Leads Handled",    color: "#4F46E5" },
  { key: "magnetSent"   as const, label: "Lead Magnet Sent", color: "#818CF8" },
  { key: "bookedCalls"  as const, label: "Booked Calls",     color: "#C7D2FE" },
  { key: "showUp"       as const, label: "Show Up Rate",     color: "#E0E7FF" },
];

const ACTIVITIES = [
  { init:"AK", name:"Ahmed Karimi",  action:"booked a call",        time:"2 min ago",   bg:"#EEF2FF", color:"#4F46E5" },
  { init:"SM", name:"Sara Moreira",  action:"received lead magnet", time:"15 min ago",  bg:"#DCFCE7", color:"#16A34A" },
  { init:"JD", name:"John Davidson", action:"booked a call",        time:"1 hour ago",  bg:"#EEF2FF", color:"#4F46E5" },
  { init:"MS", name:"Maria Santos",  action:"entered the flow",     time:"2 hours ago", bg:"#DBEAFE", color:"#2563EB" },
  { init:"CL", name:"Chris Lee",     action:"no-showed the call",   time:"3 hours ago", bg:"#FEE2E2", color:"#DC2626" },
];

// Lead Flow steps — Booking gets face image
const LEAD_FLOW_STEPS = [
  { label:"Trigger",     sub:"WhatsApp",  color:"#4F46E5", count:"142", Icon: Zap,           img: null           },
  { label:"Script 1",    sub:"Welcome",   color:"#2563EB", count:"138", Icon: Mail,          img: null           },
  { label:"Lead Magnet", sub:"Send PDF",  color:"#16A34A", count:"98",  Icon: FileText,      img: null           },
  { label:"Script 2",    sub:"Follow-up", color:"#D97706", count:"61",  Icon: Phone,         img: null           },
  { label:"Booking",     sub:"Schedule",  color:"#4F46E5", count:"34",  Icon: CalendarCheck, img: "/booking4.png" },
];

// Follow-Up Automation — first card gets face
const FOLLOWUP_AUTO_STEPS = [
  { label:"Scheduled Trigger", sub:"Time-based Send", color:"#D97706", count:"87", Icon: Clock, img: "/facefollowupautomation.png" },
  { label:"Follow-Up Message", sub:"Re-engage Lead",  color:"#2563EB", count:"72", Icon: Mail,  img: null },
];

// Follow-Up Agent — first card gets face
const FOLLOWUP_AGENT_STEPS = [
  { label:"Trigger Agent", sub:"AI Reply Trigger", color:"#7C3AED", count:"54", Icon: Zap,      img: "/facefollowupagent.png" },
  { label:"Agent Reply",   sub:"WhatsApp Reply",   color:"#16A34A", count:"48", Icon: FileText, img: null },
];

type Entry = { leadsHandled:number; magnetSent:number; bookedCalls:number; showUp:number };

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ init, bg="#EEF2FF", color="#4F46E5", size=32 }: {
  init:string; bg?:string; color?:string; size?:number;
}) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.34, fontWeight:700, color, flexShrink:0 }}>
      {init}
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function LayeredBarChart({ data, labels }: { data: Entry[]; labels: string[] }) {
  const [tooltip, setTooltip] = useState<{ idx:number; x:number; y:number } | null>(null);
  const BAR_H = 160;
  const maxVal = Math.max(...data.map(d => d.leadsHandled));

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:BAR_H + 28 }}>
        {data.map((entry, i) => {
          const scale = (v: number) => Math.max(4, Math.round((v / maxVal) * BAR_H));
          return (
            <div
              key={i}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, position:"relative" }}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const parent = e.currentTarget.closest(".chart-wrap")?.getBoundingClientRect();
                setTooltip({ idx:i, x:rect.left-(parent?.left??0)+rect.width/2, y:rect.top-(parent?.top??0) });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div style={{ width:"100%", height:scale(entry.leadsHandled), position:"relative", cursor:"pointer", borderRadius:"6px 6px 0 0", overflow:"hidden" }}>
                {LAYERS.map((layer) => (
                  <div key={layer.key} style={{ position:"absolute", bottom:0, left:0, right:0, height:scale(entry[layer.key]), background:layer.color, borderRadius:"6px 6px 0 0", transition:"height .3s" }} />
                ))}
              </div>
              <span style={{ fontSize:10, color:"#9CA3AF" }}>{labels[i]}</span>
            </div>
          );
        })}
      </div>

      {tooltip !== null && (
        <div style={{ position:"absolute", left:tooltip.x, top:tooltip.y-8, transform:"translate(-50%,-100%)", background:"#111827", borderRadius:12, padding:"12px 16px", pointerEvents:"none", zIndex:99, minWidth:190, boxShadow:"0 12px 32px rgba(0,0,0,.25)" }}>
          <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,.4)", marginBottom:10, letterSpacing:"0.8px", textTransform:"uppercase" }}>{labels[tooltip.idx]}</div>
          {LAYERS.map(layer => (
            <div key={layer.key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:layer.color, flexShrink:0 }} />
              <span style={{ fontSize:11, color:"rgba(255,255,255,.6)", flex:1 }}>{layer.label}</span>
              <span style={{ fontSize:13, color:"#fff", fontWeight:700 }}>{data[tooltip.idx][layer.key]}</span>
            </div>
          ))}
          <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:"6px solid #111827" }} />
        </div>
      )}

      <div style={{ display:"flex", gap:16, marginTop:14, flexWrap:"wrap" }}>
        {LAYERS.map(l => (
          <div key={l.key} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:l.color }} />
            <span style={{ fontSize:10, color:"#9CA3AF" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Flow Sequence Block ──────────────────────────────────────────────────────
function FlowSequence({ title, subtitle, steps, conversionRate, conversionLabel }: {
  title: string; subtitle: string;
  steps: { label:string; sub:string; color:string; count:string; Icon:any; img:string|null }[];
  conversionRate: string; conversionLabel: string;
}) {
  return (
    <div style={{ background:"#FFFFFF", borderRadius:16, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#111827", letterSpacing:"-0.2px", marginBottom:2 }}>{title}</div>
          <div style={{ fontSize:11, color:"#9CA3AF" }}>{subtitle}</div>
        </div>
        <button style={{ padding:"7px 16px", borderRadius:10, border:"none", background:"#111827", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Edit Flow
        </button>
      </div>

      <div style={{ display:"flex", alignItems:"stretch" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div className="ds-flow" style={{ flex:1, borderRadius:14, border:"1px solid #E5E7EB", background:"#FFFFFF", position:"relative", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
              {/* Top colour accent */}
              <div style={{ height:3, background:step.color, width:"100%" }} />

              {/* Face image or icon */}
              {step.img ? (
                <div style={{ height:80, overflow:"hidden", background:"#F3F4F6" }}>
                  <img src={step.img} alt={step.label} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
                </div>
              ) : (
                <div style={{ padding:"12px 14px 0" }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <step.Icon size={14} strokeWidth={1.8} color={step.color} />
                  </div>
                </div>
              )}

              <div style={{ padding: step.img ? "10px 14px 14px" : "8px 14px 14px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#111827", letterSpacing:"-0.2px", marginBottom:1 }}>{step.label}</div>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:8 }}>{step.sub}</div>
                <div style={{ fontSize:26, fontWeight:800, color:step.color, letterSpacing:"-1px", lineHeight:1 }}>{step.count}</div>
              </div>
            </div>

            {i < steps.length - 1 && (
              <div style={{ padding:"0 5px", flexShrink:0 }}>
                <svg width="18" height="10" viewBox="0 0 20 10">
                  <path d="M0 5h16M12 1l4 4-4 4" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Conversion bar */}
      <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:14, background:"#F9FAFB", borderRadius:10, padding:"11px 16px", border:"1px solid #F3F4F6" }}>
        <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:500, flexShrink:0 }}>Conversion rate</div>
        <div style={{ flex:1, height:6, background:"#E5E7EB", borderRadius:10, overflow:"hidden" }}>
          <div style={{ height:"100%", width:conversionRate, background:"linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius:10 }} />
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"#111827", flexShrink:0 }}>{conversionLabel}</div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DashboardScreen() {
  const [period, setPeriod] = useState<"weekly"|"monthly"|"yearly">("weekly");

  const chartData = period === "weekly" ? WEEKLY_DATA : period === "monthly" ? MONTHLY_DATA : YEARLY_DATA;
  const labels    = period === "weekly" ? DAYS        : period === "monthly" ? MONTHS        : YEARS;

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening";

  const stats = [
    { label:"Leads Handled",    value:"142", change:"+18%", up:true, color:"#4F46E5", lightBg:"#EEF2FF", Icon: Users         },
    { label:"Lead Magnet Sent", value:"98",  change:"+12%", up:true, color:"#16A34A", lightBg:"#DCFCE7", Icon: Mail          },
    { label:"Booked Calls",     value:"34",  change:"+8%",  up:true, color:"#2563EB", lightBg:"#DBEAFE", Icon: CalendarCheck },
    { label:"Show Up Rate",     value:"76%", change:"+5%",  up:true, color:"#D97706", lightBg:"#FEF3C7", Icon: CheckSquare   },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .ds-stat { transition: transform .2s, box-shadow .2s; cursor: pointer; }
        .ds-stat:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(0,0,0,.1) !important; }
        .ds-flow { transition: transform .2s, box-shadow .2s; cursor: pointer; }
        .ds-flow:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,.1) !important; }
        .ds-icon-btn { transition: background .15s; }
        .ds-icon-btn:hover { background: #F3F4F6 !important; }
        .ds-view-all:hover { background: #F3F4F6 !important; }
        .ds-per { transition: all .15s; }
      `}</style>

      <div style={{ padding:"28px 32px", width:"100%", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#F0F2F8", minHeight:"100vh" }}>

        {/* ── Top Bar ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:26 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", letterSpacing:"-0.5px", margin:0, marginBottom:3 }}>
              Good <span style={{ color:"#4F46E5", fontStyle:"italic" }}>{greeting}</span>
            </h1>
            <p style={{ fontSize:13, color:"#9CA3AF", fontWeight:400, margin:0 }}>Here's your LeadFlow performance overview</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="ds-icon-btn" style={{ width:38, height:38, borderRadius:10, background:"#fff", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Search size={15} strokeWidth={1.8} color="#6B7280" />
            </div>
            <div className="ds-icon-btn" style={{ width:38, height:38, borderRadius:10, background:"#fff", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
              <Bell size={15} strokeWidth={1.8} color="#6B7280" />
              <div style={{ position:"absolute", top:8, right:9, width:6, height:6, borderRadius:"50%", background:"#EF4444", border:"2px solid #fff" }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px 6px 6px", background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, cursor:"pointer" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#4F46E5,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>LA</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#111827", lineHeight:1.2 }}>LeadFlow</div>
                <div style={{ fontSize:10, color:"#9CA3AF", lineHeight:1.2 }}>Admin store</div>
              </div>
              <ChevronDown size={13} color="#9CA3AF" strokeWidth={1.8} style={{ marginLeft:4 }} />
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
          {stats.map((s, i) => (
            <div key={i} className="ds-stat" style={{ background:"#FFFFFF", borderRadius:16, padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,.05)", position:"relative", overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:s.lightBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <s.Icon size={17} strokeWidth={1.8} color={s.color} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color: s.up?"#16A34A":"#DC2626", background: s.up?"#DCFCE7":"#FEE2E2", padding:"3px 9px", borderRadius:20, display:"flex", alignItems:"center", gap:3 }}>
                  {s.up ? <TrendingUp size={9} strokeWidth={2}/> : <TrendingDown size={9} strokeWidth={2}/>} {s.change}
                </span>
              </div>
              <div style={{ fontSize:13, color:"#6B7280", fontWeight:500, marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:34, fontWeight:800, color:"#111827", letterSpacing:"-1.5px", lineHeight:1, marginBottom:12 }}>{s.value}</div>
              <button style={{ fontSize:10, fontWeight:600, color:"#4F46E5", border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:3 }}>
                View details <ArrowUpRight size={10} strokeWidth={2.5}/>
              </button>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},${s.color}55)` }} />
            </div>
          ))}
        </div>

        {/* ── Chart + Activities ── */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:20 }}>
          <div style={{ background:"#FFFFFF", borderRadius:16, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#111827", letterSpacing:"-0.2px", marginBottom:3 }}>Performance Overview</div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>Leads through your flow</div>
              </div>
              <div style={{ display:"flex", background:"#F3F4F6", borderRadius:10, padding:4, gap:2 }}>
                {(["weekly","monthly","yearly"] as const).map(p => (
                  <button key={p} className="ds-per" onClick={() => setPeriod(p)} style={{ padding:"5px 14px", borderRadius:7, border:"none", fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600, background:period===p?"#FFFFFF":"transparent", color:period===p?"#111827":"#9CA3AF", boxShadow:period===p?"0 1px 4px rgba(0,0,0,.1)":"none" }}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-wrap" style={{ position:"relative" }}>
              <LayeredBarChart data={chartData} labels={labels} />
            </div>
          </div>

          <div style={{ background:"#FFFFFF", borderRadius:16, padding:"22px 20px", boxShadow:"0 1px 4px rgba(0,0,0,.05)", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Clock size={13} strokeWidth={1.8} color="#4F46E5" />
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:"#111827", letterSpacing:"-0.2px" }}>Recent Activities</div>
            </div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:16 }}>All latest events</div>
            <div style={{ flex:1 }}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:i<ACTIVITIES.length-1?"1px solid #F3F4F6":"none" }}>
                  <Avatar init={a.init} bg={a.bg} color={a.color} size={30} />
                  <div>
                    <div style={{ fontSize:12, color:"#111827", lineHeight:1.5 }}>
                      <span style={{ fontWeight:700 }}>{a.name}</span>{" "}
                      <span style={{ color:"#6B7280", fontWeight:400 }}>{a.action}</span>
                    </div>
                    <div style={{ fontSize:10, color:"#9CA3AF", marginTop:2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="ds-view-all" style={{ width:"100%", marginTop:14, padding:"9px", borderRadius:10, border:"1px solid #E5E7EB", background:"transparent", fontSize:11, fontWeight:600, color:"#4F46E5", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"background .15s" }}>
              View all activity
            </button>
          </div>
        </div>

        {/* ── Lead Flow Sequence ── */}
        <div style={{ marginBottom:14 }}>
          <FlowSequence
            title="Lead Flow Sequence"
            subtitle="Your main automation pipeline"
            steps={LEAD_FLOW_STEPS}
            conversionRate="24%"
            conversionLabel="24% (34/142)"
          />
        </div>

        {/* ── Follow-Up Sequences side by side ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FlowSequence
            title="Follow-Up Automation"
            subtitle="Scheduled time-based follow-up"
            steps={FOLLOWUP_AUTO_STEPS}
            conversionRate="82%"
            conversionLabel="82% (72/87)"
          />
          <FlowSequence
            title="Follow-Up Agent"
            subtitle="AI agent re-engages your leads"
            steps={FOLLOWUP_AGENT_STEPS}
            conversionRate="88%"
            conversionLabel="88% (48/54)"
          />
        </div>

      </div>
    </>
  );
}
