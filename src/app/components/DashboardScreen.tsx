import { useState } from "react";
import {
  TrendingUp, ArrowUpRight, Clock, CheckSquare,
  Users, Mail, CalendarCheck, Zap, Phone, FileText,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = ["2019","2020","2021","2022","2023","2024"];

// Each bar: values go from biggest → smallest (layered behind → in front)
// leadsHandled > magnetSent > bookedCalls > showUp
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

// Layers ordered biggest → smallest (drawn back to front)
const LAYERS = [
  { key: "leadsHandled" as const, label: "Leads Handled",    color: "#B8B5F0" },
  { key: "magnetSent"   as const, label: "Lead Magnet Sent", color: "#6ECFB0" },
  { key: "bookedCalls"  as const, label: "Booked Calls",     color: "#F0A882" },
  { key: "showUp"       as const, label: "Show Up Rate",     color: "#A8CC6A" },
];

const ACTIVITIES = [
  { init:"AK", name:"Ahmed Karimi",  action:"booked a call",        time:"2 min ago",   bg:"#EEEDF8", color:"#4A46B5" },
  { init:"SM", name:"Sara Moreira",  action:"received lead magnet", time:"15 min ago",  bg:"#E1F5EE", color:"#1D9E75" },
  { init:"JD", name:"John Davidson", action:"booked a call",        time:"1 hour ago",  bg:"#EEEDF8", color:"#4A46B5" },
  { init:"MS", name:"Maria Santos",  action:"entered the flow",     time:"2 hours ago", bg:"#E6F1FB", color:"#185FA5" },
  { init:"CL", name:"Chris Lee",     action:"no-showed the call",   time:"3 hours ago", bg:"#FCEBEB", color:"#A32D2D" },
];

const LEADS = [
  { init:"AK", name:"Ahmed Karimi",  step:"Booking",     status:"Booked",      sBg:"#EEEDF8", sColor:"#4A46B5", date:"Apr 25", aBg:"#EEEDF8", aColor:"#4A46B5" },
  { init:"SM", name:"Sara Moreira",  step:"Lead Magnet", status:"Magnet Sent", sBg:"#E1F5EE", sColor:"#0F6E56", date:"Apr 24", aBg:"#E1F5EE", aColor:"#1D9E75" },
  { init:"JD", name:"John Davidson", step:"Booking",     status:"Booked",      sBg:"#EEEDF8", sColor:"#4A46B5", date:"Apr 24", aBg:"#EEEDF8", aColor:"#4A46B5" },
  { init:"MS", name:"Maria Santos",  step:"Script 1",    status:"New",         sBg:"#E6F1FB", sColor:"#185FA5", date:"Apr 23", aBg:"#E6F1FB", aColor:"#185FA5" },
  { init:"CL", name:"Chris Lee",     step:"Booking",     status:"No Show",     sBg:"#FCEBEB", sColor:"#A32D2D", date:"Apr 22", aBg:"#FCEBEB", aColor:"#A32D2D" },
];

const FLOW_STEPS = [
  { label:"Trigger",     sub:"WhatsApp",  color:"#4A46B5", count:"142", Icon: Zap          },
  { label:"Script 1",    sub:"Welcome",   color:"#378ADD", count:"138", Icon: Mail         },
  { label:"Lead Magnet", sub:"Send PDF",  color:"#1D9E75", count:"98",  Icon: FileText     },
  { label:"Script 2",    sub:"Follow-up", color:"#BA7517", count:"61",  Icon: Phone        },
  { label:"Booking",     sub:"Schedule",  color:"#D85A30", count:"34",  Icon: CalendarCheck },
];

type Entry = { leadsHandled:number; magnetSent:number; bookedCalls:number; showUp:number };

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ init, bg="#EEEDF8", color="#4A46B5", size=32 }: {
  init:string; bg?:string; color?:string; size?:number;
}) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.34, fontWeight:500, color, flexShrink:0, fontFamily:"'DM Sans',sans-serif" }}>
      {init}
    </div>
  );
}

// ─── Layered Bar Chart ────────────────────────────────────────────────────────

function LayeredBarChart({ data, labels }: { data: Entry[]; labels: string[] }) {
  const [tooltip, setTooltip] = useState<{ idx:number; x:number; y:number } | null>(null);
  const BAR_H = 180;
  const maxVal = Math.max(...data.map(d => d.leadsHandled));

  return (
    <div style={{ position:"relative" }}>
      {/* Bars */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:BAR_H + 28 }}>
        {data.map((entry, i) => {
          // scale all values relative to max leadsHandled
          const scale = (v: number) => Math.max(4, Math.round((v / maxVal) * BAR_H));
          const barWidth = "100%";

          return (
            <div
              key={i}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, position:"relative" }}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const parent = e.currentTarget.closest(".chart-wrap")?.getBoundingClientRect();
                setTooltip({
                  idx: i,
                  x: rect.left - (parent?.left ?? 0) + rect.width / 2,
                  y: rect.top  - (parent?.top  ?? 0),
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Layered bars: all positioned from bottom, each on top of the last */}
              <div style={{ width:barWidth, height:scale(entry.leadsHandled), position:"relative", cursor:"pointer" }}>
                {LAYERS.map((layer) => (
                  <div
                    key={layer.key}
                    style={{
                      position:"absolute",
                      bottom:0,
                      left:0,
                      right:0,
                      height: scale(entry[layer.key]),
                      background: layer.color,
                      borderRadius: "6px 6px 0 0",
                      transition: "height .3s",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize:10, color:"#8A8680", fontWeight:300 }}>{labels[i]}</span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip !== null && (
        <div style={{
          position:"absolute",
          left: tooltip.x,
          top: tooltip.y - 8,
          transform:"translate(-50%,-100%)",
          background:"#1A1916",
          borderRadius:10,
          padding:"10px 14px",
          pointerEvents:"none",
          zIndex:99,
          minWidth:180,
          boxShadow:"0 8px 24px rgba(0,0,0,.2)",
        }}>
          <div style={{ fontSize:10, fontWeight:500, color:"rgba(255,255,255,.45)", marginBottom:8, letterSpacing:"0.5px", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>
            {labels[tooltip.idx]}
          </div>
          {LAYERS.map(layer => (
            <div key={layer.key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:layer.color, flexShrink:0 }} />
              <span style={{ fontSize:11, color:"rgba(255,255,255,.65)", flex:1, fontFamily:"'DM Sans',sans-serif" }}>{layer.label}</span>
              <span style={{ fontSize:13, color:"#fff", fontFamily:"'Libre Baskerville',serif", fontWeight:400 }}>
                {data[tooltip.idx][layer.key]}
              </span>
            </div>
          ))}
          <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:"6px solid #1A1916" }} />
        </div>
      )}

      {/* Legend */}
      <div style={{ display:"flex", gap:16, marginTop:14, flexWrap:"wrap" }}>
        {LAYERS.map(l => (
          <div key={l.key} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:l.color }} />
            <span style={{ fontSize:10, color:"#8A8680", fontWeight:300, fontFamily:"'DM Sans',sans-serif" }}>{l.label}</span>
          </div>
        ))}
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
    { label:"Leads Handled",    value:"142", change:"+18%", barColor:"#4A46B5", barW:"72%", Icon: Users         },
    { label:"Lead Magnet Sent", value:"98",  change:"+12%", barColor:"#1D9E75", barW:"55%", Icon: Mail          },
    { label:"Booked Calls",     value:"34",  change:"+8%",  barColor:"#D85A30", barW:"34%", Icon: CalendarCheck },
    { label:"Show Up Rate",     value:"76%", change:"+5%",  barColor:"#639922", barW:"76%", Icon: CheckSquare   },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .lf-stat:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.08) !important; }
        .lf-flow:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.07) !important; }
        .lf-row:hover  { background:#F7F6F3 !important; }
        .lf-per:hover  { background:#E8E6E0 !important; }
        .lf-all:hover  { background:#EEEDF8 !important; }
        .lf-btn:hover  { opacity:.8; }
      `}</style>

      <div style={{ padding:"36px 40px", width:"100%", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", background:"#F9F9F8", minHeight:"100vh" }}>

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:26, fontWeight:400, color:"#1A1916", letterSpacing:"-0.5px", marginBottom:4 }}>
            Good <em style={{ fontStyle:"italic", color:"#4A46B5" }}>{greeting}</em>
          </h1>
          <p style={{ fontSize:13, color:"#8A8680", fontWeight:300 }}>Here's your LeadFlow performance overview</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {stats.map((s, i) => (
            <div key={i} className="lf-stat" style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:16, padding:"20px 18px", position:"relative", overflow:"hidden", cursor:"pointer", transition:"box-shadow .2s,transform .2s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:"#F2F1EE", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <s.Icon size={15} strokeWidth={1.5} color="#8A8680" />
                </div>
                <button style={{ fontSize:10, color:"#4A46B5", border:"1px solid #EEEDF8", background:"#EEEDF8", padding:"4px 10px", borderRadius:20, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  View details
                </button>
              </div>
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:40, fontWeight:400, color:"#1A1916", letterSpacing:-2, lineHeight:1, marginBottom:5 }}>{s.value}</div>
              <div style={{ fontSize:12, color:"#8A8680", fontWeight:300, marginBottom:12 }}>{s.label}</div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:500, color:"#3B7D4F", background:"#EAF3E0", padding:"3px 9px", borderRadius:20 }}>
                <TrendingUp size={9} /> {s.change}
              </div>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3 }}>
                <div style={{ height:"100%", width:s.barW, background:s.barColor, borderRadius:"0 3px 3px 0" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Activities */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:20 }}>

          {/* Chart */}
          <div style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:16, padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:400, color:"#1A1916", marginBottom:3 }}>Performance Overview</div>
                <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Leads through your flow</div>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {(["weekly","monthly","yearly"] as const).map(p => (
                  <button key={p} className="lf-per" onClick={() => setPeriod(p)} style={{ padding:"5px 12px", borderRadius:7, border:"none", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s", background:period===p ? "#1A1916" : "#F2F1EE", color:period===p ? "#fff" : "#8A8680" }}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-wrap" style={{ position:"relative" }}>
              <LayeredBarChart data={chartData} labels={labels} />
            </div>
          </div>

          {/* Activities */}
          <div style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:16, padding:24, display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <Clock size={14} strokeWidth={1.5} color="#8A8680" />
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:400, color:"#1A1916" }}>Recent Activities</div>
            </div>
            <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic", marginBottom:16 }}>All latest events</div>
            <div style={{ flex:1 }}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:i < ACTIVITIES.length-1 ? "1px solid #F2F1EE" : "none" }}>
                  <Avatar init={a.init} bg={a.bg} color={a.color} size={30} />
                  <div>
                    <div style={{ fontSize:12, color:"#1A1916", lineHeight:1.5 }}>
                      <span style={{ fontWeight:500 }}>{a.name}</span>{" "}
                      <span style={{ color:"#8A8680" }}>{a.action}</span>
                    </div>
                    <div style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginTop:2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="lf-all" style={{ width:"100%", marginTop:14, padding:"9px", borderRadius:9, border:"1px solid #E8E6E0", background:"transparent", fontSize:11, color:"#4A46B5", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>
              View all activity
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:16, overflow:"hidden", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:"1px solid #E8E6E0" }}>
            <div>
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:400, color:"#1A1916" }}>Recent Leads</div>
              <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic", marginTop:2 }}>Latest leads in your pipeline</div>
            </div>
            <button className="lf-btn" style={{ padding:"7px 16px", borderRadius:9, border:"none", background:"#1A1916", color:"#fff", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:5, transition:"opacity .15s" }}>
              <ArrowUpRight size={12} /> View All
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr", padding:"9px 24px", background:"#F9F9F8" }}>
            {["Lead Name","Flow Step","Status","Date"].map(col => (
              <div key={col} style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px" }}>{col}</div>
            ))}
          </div>
          {LEADS.map((lead, i) => (
            <div key={i} className="lf-row" style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr", padding:"13px 24px", borderBottom:i < LEADS.length-1 ? "1px solid #F5F4F0" : "none", cursor:"pointer", transition:"background .1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#1A1916" }}>
                <Avatar init={lead.init} bg={lead.aBg} color={lead.aColor} size={28} />
                {lead.name}
              </div>
              <div style={{ display:"flex", alignItems:"center", fontSize:12, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>{lead.step}</div>
              <div style={{ display:"flex", alignItems:"center" }}>
                <span style={{ fontSize:9, fontWeight:500, color:lead.sColor, background:lead.sBg, padding:"3px 10px", borderRadius:20 }}>{lead.status}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", fontSize:11, color:"#8A8680", fontWeight:300 }}>{lead.date}</div>
            </div>
          ))}
        </div>

        {/* Lead Flow Sequence */}
        <div style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:16, padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
            <div>
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:400, color:"#1A1916", marginBottom:3 }}>Lead Flow Sequence</div>
              <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Your current automation pipeline</div>
            </div>
            <button className="lf-btn" style={{ padding:"7px 16px", borderRadius:9, border:"none", background:"#1A1916", color:"#fff", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>
              Edit Flow
            </button>
          </div>
          <div style={{ display:"flex", alignItems:"center" }}>
            {FLOW_STEPS.map((step, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
                <div className="lf-flow" style={{ flex:1, padding:"14px", borderRadius:12, border:"1px solid #E8E6E0", background:"#FFFFFF", position:"relative", overflow:"hidden", cursor:"pointer", transition:"transform .2s,box-shadow .2s" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:step.color }} />
                  <div style={{ width:28, height:28, borderRadius:7, background:"#F2F1EE", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                    <step.Icon size={13} strokeWidth={1.5} color={step.color} />
                  </div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:13, fontWeight:400, color:"#1A1916", marginBottom:2 }}>{step.label}</div>
                  <div style={{ fontSize:10, color:"#8A8680", fontWeight:300, fontStyle:"italic", marginBottom:10 }}>{step.sub}</div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:24, fontWeight:400, color:step.color, letterSpacing:-1 }}>{step.count}</div>
                </div>
                {i < FLOW_STEPS.length-1 && (
                  <div style={{ padding:"0 6px", flexShrink:0 }}>
                    <svg width="20" height="10" viewBox="0 0 20 10">
                      <path d="M0 5h16M12 1l4 4-4 4" stroke="#C8C5BC" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:16, background:"#F2F1EE", borderRadius:10, padding:"13px 18px" }}>
            <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, flexShrink:0, fontStyle:"italic" }}>Conversion rate</div>
            <div style={{ flex:1, height:5, background:"#E8E6E0", borderRadius:10, overflow:"hidden" }}>
              <div style={{ height:"100%", width:"24%", background:"#1A1916", borderRadius:10 }} />
            </div>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:13, fontWeight:400, color:"#1A1916", flexShrink:0 }}>24% (34/142)</div>
          </div>
        </div>

      </div>
    </>
  );
}
