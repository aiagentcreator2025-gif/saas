import { useState } from "react";
import {
  TrendingUp, TrendingDown, Users, Mail, CalendarCheck, CheckSquare,
  Zap, Phone, FileText, Clock, LayoutDashboard, BarChart2,
  ShoppingBag, UserCircle, CreditCard, Receipt, Settings,
  MessageSquare, HelpCircle, Bell, Search, ChevronDown,
  ArrowUpRight, CalendarDays, type LucideIcon,
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

const ACTIVITIES = [
  { init:"AK", name:"Ahmed Karimi",  action:"booked a call",        time:"2 min ago",   bg:"#EEF2FF", color:"#4F46E5" },
  { init:"SM", name:"Sara Moreira",  action:"received lead magnet", time:"15 min ago",  bg:"#DCFCE7", color:"#16A34A" },
  { init:"JD", name:"John Davidson", action:"booked a call",        time:"1 hour ago",  bg:"#EEF2FF", color:"#4F46E5" },
  { init:"MS", name:"Maria Santos",  action:"entered the flow",     time:"2 hours ago", bg:"#DBEAFE", color:"#2563EB" },
  { init:"CL", name:"Chris Lee",     action:"no-showed the call",   time:"3 hours ago", bg:"#FEE2E2", color:"#DC2626" },
];

type Entry = { leadsHandled:number; magnetSent:number; bookedCalls:number; showUp:number };

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, indent }: { icon: LucideIcon; label: string; active?: boolean; indent?: boolean }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding: indent ? "8px 14px 8px 20px" : "8px 14px",
      borderRadius:10, cursor:"pointer", marginBottom:2,
      background: active ? "#4F46E5" : "transparent",
      color: active ? "#fff" : "#6B7280",
      fontSize:13, fontWeight: active ? 600 : 500,
      transition:"all .15s",
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "#F3F4F6"; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <Icon size={15} strokeWidth={1.8} />
      {label}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart() {
  const segments = [
    { label:"Leads Handled",    value:142, color:"#4F46E5", pct:0.52 },
    { label:"Lead Magnet Sent", value:98,  color:"#818CF8", pct:0.20 },
    { label:"Booked Calls",     value:34,  color:"#E0E7FF", pct:0.16 },
    { label:"Show Up Rate",     value:27,  color:"#C7D2FE", pct:0.12 },
  ];

  const cx = 80, cy = 80, r1 = 62, r2 = 38;
  let cumAngle = -Math.PI / 2;

  function arc(pct: number) {
    const start = cumAngle;
    const end = cumAngle + pct * 2 * Math.PI - 0.03;
    cumAngle = end + 0.03;
    const x1s = cx + r1 * Math.cos(start), y1s = cy + r1 * Math.sin(start);
    const x1e = cx + r1 * Math.cos(end),   y1e = cy + r1 * Math.sin(end);
    const x2s = cx + r2 * Math.cos(end),   y2s = cy + r2 * Math.sin(end);
    const x2e = cx + r2 * Math.cos(start), y2e = cy + r2 * Math.sin(start);
    const large = pct > 0.5 ? 1 : 0;
    return `M ${x1s} ${y1s} A ${r1} ${r1} 0 ${large} 1 ${x1e} ${y1e} L ${x2s} ${y2s} A ${r2} ${r2} 0 ${large} 0 ${x2e} ${y2e} Z`;
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          {segments.map((s, i) => (
            <path key={i} d={arc(s.pct)} fill={s.color} style={{ filter:"drop-shadow(0 2px 6px rgba(79,70,229,.2))" }} />
          ))}
          <circle cx={cx} cy={cy} r={30} fill="white" />
          <text x={cx} y={cy-6} textAnchor="middle" fontSize={13} fontWeight={800} fill="#111827">301</text>
          <text x={cx} y={cy+10} textAnchor="middle" fontSize={8} fill="#9CA3AF">Total</text>
        </svg>
      </div>
      <div style={{ flex:1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:s.color }} />
              <span style={{ fontSize:11, color:"#6B7280" }}>{s.label}</span>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bubble Bar Chart ─────────────────────────────────────────────────────────
function BubbleBarChart({ data, labels }: { data: Entry[]; labels: string[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const maxVal = Math.max(...data.map(d => d.leadsHandled));
  const BAR_H = 140;

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, height: BAR_H + 24 }}>
        {data.map((entry, i) => {
          const h1 = Math.max(8, Math.round((entry.leadsHandled / maxVal) * BAR_H));
          const h2 = Math.max(8, Math.round((entry.magnetSent / maxVal) * BAR_H));
          const isHovered = tooltip?.idx === i;
          return (
            <div
              key={i}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", position:"relative" }}
              onMouseEnter={() => setTooltip({ idx: i })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Tooltip bubble */}
              {isHovered && (
                <div style={{
                  position:"absolute", bottom: h1 + 14, left:"50%", transform:"translateX(-50%)",
                  background:"#111827", color:"#fff", borderRadius:10, padding:"8px 12px",
                  fontSize:11, fontWeight:600, whiteSpace:"nowrap", zIndex:10,
                  boxShadow:"0 8px 24px rgba(0,0,0,.25)",
                  display:"flex", flexDirection:"column", gap:3,
                }}>
                  <span style={{ color:"#818CF8" }}>● {entry.leadsHandled} Leads</span>
                  <span style={{ color:"#C7D2FE" }}>● {entry.magnetSent} Magnets</span>
                  <div style={{ position:"absolute", bottom:-5, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:"5px solid #111827" }} />
                </div>
              )}
              {/* Two bars side by side */}
              <div style={{ display:"flex", gap:3, alignItems:"flex-end", width:"100%" }}>
                <div style={{ flex:1, height:h1, background: isHovered ? "#4F46E5" : "#818CF8", borderRadius:"6px 6px 0 0", transition:"all .2s" }} />
                <div style={{ flex:1, height:h2, background: isHovered ? "#818CF8" : "#E0E7FF", borderRadius:"6px 6px 0 0", transition:"all .2s" }} />
              </div>
              <span style={{ fontSize:9, color:"#9CA3AF" }}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
      {/* Y-axis labels */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:"#818CF8" }} />
          <span style={{ fontSize:10, color:"#9CA3AF" }}>Leads Handled</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:"#E0E7FF" }} />
          <span style={{ fontSize:10, color:"#9CA3AF" }}>Lead Magnet Sent</span>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ init, bg="#EEF2FF", color="#4F46E5", size=30 }: { init:string; bg?:string; color?:string; size?:number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.33, fontWeight:700, color, flexShrink:0 }}>
      {init}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardScreen() {
  const [period, setPeriod] = useState<"weekly"|"monthly"|"yearly">("weekly");
  const [activeNav, setActiveNav] = useState("Report");

  const chartData = period === "weekly" ? WEEKLY_DATA : period === "monthly" ? MONTHLY_DATA : YEARLY_DATA;
  const labels    = period === "weekly" ? DAYS        : period === "monthly" ? MONTHS        : YEARS;

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening";
  const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });

  const stats = [
    { label:"Leads Handled",    sub:"vs last month", value:"142", change:"+18%", up:true,  color:"#4F46E5", lightBg:"linear-gradient(135deg,#4F46E5,#6366F1)", Icon: Users         },
    { label:"Lead Magnet Sent", sub:"vs last month", value:"98",  change:"+12%", up:true,  color:"#2563EB", lightBg:"#fff",                                    Icon: Mail          },
    { label:"Booked Calls",     sub:"vs last month", value:"34",  change:"-3%",  up:false, color:"#111827", lightBg:"#fff",                                    Icon: CalendarCheck },
    { label:"Show Up Rate",     sub:"vs last month", value:"76%", change:"+5%",  up:true,  color:"#111827", lightBg:"#fff",                                    Icon: CheckSquare   },
  ];

  const flowStats = [
    { label:"WhatsApp Triggers", value:"142", color:"#4F46E5", Icon: Zap           },
    { label:"Scripts Sent",      value:"138", color:"#2563EB", Icon: FileText      },
    { label:"Lead Magnets",      value:"98",  color:"#16A34A", Icon: Mail          },
    { label:"Follow-Ups",        value:"61",  color:"#D97706", Icon: Phone         },
    { label:"Bookings",          value:"34",  color:"#7C3AED", Icon: CalendarCheck },
  ];

  const menuGroups = [
    { label:"MENU", items:[
      { icon: LayoutDashboard, label:"Dashboard" },
      { icon: BarChart2,       label:"Report",   active: true },
      { icon: ShoppingBag,     label:"Products" },
      { icon: UserCircle,      label:"Consumer" },
    ]},
    { label:"FINANCIAL", items:[
      { icon: CreditCard, label:"Transactions" },
      { icon: Receipt,    label:"Invoices"     },
    ]},
    { label:"TOOLS", items:[
      { icon: Settings,      label:"Settings" },
      { icon: MessageSquare, label:"Feedback" },
      { icon: HelpCircle,    label:"Help"     },
    ]},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .nav-item:hover { background:#F3F4F6 !important; }
        .stat-card { transition:transform .2s,box-shadow .2s; cursor:pointer; }
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 20px 48px rgba(0,0,0,.12) !important; }
        .flow-pill { transition:all .15s; cursor:pointer; }
        .flow-pill:hover { transform:scale(1.04); }
        .per-btn { transition:all .15s; cursor:pointer; }
        .per-btn:hover { background:rgba(255,255,255,.6) !important; }
        ::-webkit-scrollbar { width:4px; } 
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:4px; }
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:"#EDEEF5", fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden" }}>

        {/* ══════════════ SIDEBAR ══════════════ */}
        <div style={{ width:200, flexShrink:0, background:"#fff", display:"flex", flexDirection:"column", padding:"24px 12px", borderRight:"1px solid #F3F4F6", overflowY:"auto" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 8px", marginBottom:28 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#4F46E5,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Zap size={16} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontSize:15, fontWeight:800, color:"#111827", letterSpacing:"-0.3px" }}>LeadFlow</span>
          </div>

          {/* Nav groups */}
          {menuGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom:20 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#9CA3AF", letterSpacing:"1px", padding:"0 14px", marginBottom:6 }}>{group.label}</div>
              {group.items.map((item, ii) => (
                <div
                  key={ii}
                  className="nav-item"
                  onClick={() => setActiveNav(item.label)}
                  style={{
                    display:"flex", alignItems:"center", gap:9,
                    padding:"9px 14px", borderRadius:10, cursor:"pointer", marginBottom:1,
                    background: activeNav===item.label ? "#4F46E5" : "transparent",
                    color: activeNav===item.label ? "#fff" : "#6B7280",
                    fontSize:12, fontWeight: activeNav===item.label ? 600 : 500,
                    transition:"all .15s",
                  }}
                >
                  <item.icon size={14} strokeWidth={1.8} />
                  {item.label}
                </div>
              ))}
            </div>
          ))}

          {/* Upgrade card */}
          <div style={{ marginTop:"auto", background:"linear-gradient(135deg,#111827,#1F2937)", borderRadius:16, padding:"18px 16px", color:"#fff" }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
              <Zap size={15} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>Upgrade Pro</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", marginBottom:14, lineHeight:1.5 }}>Discover benefits of an upgraded account</div>
            <button style={{ width:"100%", padding:"9px", borderRadius:10, border:"none", background:"#4F46E5", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Upgrade $30
            </button>
          </div>
        </div>

        {/* ══════════════ MAIN ══════════════ */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 28px 24px", display:"flex", flexDirection:"column", gap:20 }}>

          {/* ── Top Bar ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:2 }}>
                Good {greeting} 👋
              </h1>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#9CA3AF" }}>
                <CalendarDays size={12} strokeWidth={1.8} />
                {today}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"#fff", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Search size={14} strokeWidth={1.8} color="#6B7280" />
              </div>
              <div style={{ width:38, height:38, borderRadius:10, background:"#fff", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
                <Bell size={14} strokeWidth={1.8} color="#6B7280" />
                <div style={{ position:"absolute", top:9, right:10, width:6, height:6, borderRadius:"50%", background:"#EF4444", border:"2px solid #fff" }} />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px 5px 5px", background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, cursor:"pointer" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#4F46E5,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>LA</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#111827", lineHeight:1.2 }}>LeadFlow</div>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>Admin store</div>
                </div>
                <ChevronDown size={12} color="#9CA3AF" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* ── Stat Cards Row ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {stats.map((s, i) => {
              const isDark = i === 0;
              return (
                <div key={i} className="stat-card" style={{
                  borderRadius:18, padding:"20px",
                  background: isDark ? s.lightBg : "#fff",
                  boxShadow: isDark ? "0 12px 40px rgba(79,70,229,.35)" : "0 1px 4px rgba(0,0,0,.06)",
                  position:"relative", overflow:"hidden",
                }}>
                  {/* Decorative bubble */}
                  {isDark && (
                    <>
                      <div style={{ position:"absolute", top:-20, right:-20, width:90, height:90, borderRadius:"50%", background:"rgba(255,255,255,.12)" }} />
                      <div style={{ position:"absolute", bottom:-30, right:20, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,.08)" }} />
                    </>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, position:"relative" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background: isDark ? "rgba(255,255,255,.2)" : "#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <s.Icon size={16} strokeWidth={1.8} color={isDark ? "#fff" : s.color} />
                    </div>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                      color: s.up ? (isDark?"#fff":"#16A34A") : "#DC2626",
                      background: s.up ? (isDark?"rgba(255,255,255,.2)":"#DCFCE7") : "#FEE2E2",
                      display:"flex", alignItems:"center", gap:3,
                    }}>
                      {s.up ? <TrendingUp size={9} strokeWidth={2}/> : <TrendingDown size={9} strokeWidth={2}/>} {s.change}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color: isDark ? "rgba(255,255,255,.7)" : "#6B7280", fontWeight:500, marginBottom:4, position:"relative" }}>{s.label}</div>
                  <div style={{ fontSize:30, fontWeight:800, color: isDark ? "#fff" : "#111827", letterSpacing:"-1px", lineHeight:1, marginBottom:4, position:"relative" }}>{s.value}</div>
                  <div style={{ fontSize:10, color: isDark ? "rgba(255,255,255,.5)" : "#9CA3AF", position:"relative" }}>{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* ── Chart + Donut Row ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1.7fr 1fr", gap:16 }}>

            {/* Bubble Bar Chart */}
            <div style={{ background:"#fff", borderRadius:18, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#111827", letterSpacing:"-0.3px", marginBottom:2 }}>Lead Habits</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>Track your lead flow performance</div>
                </div>
                <div style={{ display:"flex", background:"#F3F4F6", borderRadius:10, padding:3, gap:1 }}>
                  {(["weekly","monthly","yearly"] as const).map(p => (
                    <button key={p} className="per-btn" onClick={() => setPeriod(p)} style={{
                      padding:"5px 12px", borderRadius:8, border:"none", fontSize:10, cursor:"pointer",
                      fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600,
                      background: period===p ? "#fff" : "transparent",
                      color: period===p ? "#111827" : "#9CA3AF",
                      boxShadow: period===p ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                    }}>
                      {p.charAt(0).toUpperCase()+p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <BubbleBarChart data={chartData} labels={labels} />
            </div>

            {/* Donut / Product Statistic */}
            <div style={{ background:"#fff", borderRadius:18, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#111827", letterSpacing:"-0.3px", marginBottom:2 }}>Flow Stats</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>Track your flow metrics</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#9CA3AF", background:"#F9FAFB", border:"1px solid #F3F4F6", borderRadius:8, padding:"5px 10px", cursor:"pointer" }}>
                  Today <ChevronDown size={10} strokeWidth={2} />
                </div>
              </div>
              <DonutChart />
              {/* Mini stat below donut */}
              <div style={{ marginTop:16, background:"#F9FAFB", borderRadius:12, padding:"12px 14px", border:"1px solid #F3F4F6" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, color:"#9CA3AF" }}>Conversion rate</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#4F46E5" }}>24%</span>
                </div>
                <div style={{ height:5, background:"#E5E7EB", borderRadius:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:"24%", background:"linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius:10 }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Row: Flow Pills + Recent Activity ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1.7fr 1fr", gap:16 }}>

            {/* Flow Pills — Customer Growth equivalent */}
            <div style={{ background:"#fff", borderRadius:18, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#111827", letterSpacing:"-0.3px", marginBottom:2 }}>Booking Flow</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>Your main automation pipeline</div>
                </div>
                <button style={{ padding:"7px 16px", borderRadius:10, border:"none", background:"#111827", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Edit Flow
                </button>
              </div>

              {/* Flow steps as bubbles */}
              <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                {[
                  { label:"Trigger",     sub:"WhatsApp",  color:"#4F46E5", count:"142", Icon: Zap,           bg:"#EEF2FF" },
                  { label:"Script 1",    sub:"Welcome",   color:"#2563EB", count:"138", Icon: Mail,          bg:"#DBEAFE" },
                  { label:"Lead Magnet", sub:"Send PDF",  color:"#16A34A", count:"98",  Icon: FileText,      bg:"#DCFCE7" },
                  { label:"Script 2",    sub:"Follow-up", color:"#D97706", count:"61",  Icon: Phone,         bg:"#FEF3C7" },
                  { label:"Booking",     sub:"Schedule",  color:"#7C3AED", count:"34",  Icon: CalendarCheck, bg:"#EDE9FE" },
                ].map((step, i, arr) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
                    <div className="flow-pill" style={{
                      flex:1, borderRadius:14, border:`1.5px solid ${step.color}22`,
                      background:"#FAFAFA", padding:"14px 12px", textAlign:"center",
                      boxShadow:"0 2px 8px rgba(0,0,0,.04)",
                    }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:step.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>
                        <step.Icon size={16} strokeWidth={1.8} color={step.color} />
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color:"#111827", marginBottom:1 }}>{step.label}</div>
                      <div style={{ fontSize:9, color:"#9CA3AF", marginBottom:8 }}>{step.sub}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:step.color, letterSpacing:"-0.5px" }}>{step.count}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ padding:"0 3px", flexShrink:0 }}>
                        <svg width="14" height="8" viewBox="0 0 16 8">
                          <path d="M0 4h12M9 1l3 3-3 3" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conversion bar */}
              <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:12, background:"#F9FAFB", borderRadius:10, padding:"10px 14px", border:"1px solid #F3F4F6" }}>
                <span style={{ fontSize:11, color:"#9CA3AF", flexShrink:0 }}>Conversion rate</span>
                <div style={{ flex:1, height:5, background:"#E5E7EB", borderRadius:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:"24%", background:"linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius:10 }} />
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:"#111827", flexShrink:0 }}>24% (34/142)</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background:"#fff", borderRadius:18, padding:"22px 20px", boxShadow:"0 1px 4px rgba(0,0,0,.06)", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#111827", letterSpacing:"-0.3px" }}>Recent Activity</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#9CA3AF", background:"#F9FAFB", border:"1px solid #F3F4F6", borderRadius:8, padding:"5px 10px", cursor:"pointer" }}>
                  Today <ChevronDown size={10} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:16 }}>All latest events</div>
              <div style={{ flex:1 }}>
                {ACTIVITIES.map((a, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom: i < ACTIVITIES.length-1 ? "1px solid #F9FAFB" : "none" }}>
                    <Avatar init={a.init} bg={a.bg} color={a.color} size={32} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"#111827", lineHeight:1.5 }}>
                        <span style={{ fontWeight:700 }}>{a.name}</span>{" "}
                        <span style={{ color:"#6B7280" }}>{a.action}</span>
                      </div>
                      <div style={{ fontSize:10, color:"#9CA3AF", marginTop:1 }}>{a.time}</div>
                    </div>
                    <ArrowUpRight size={12} color="#D1D5DB" strokeWidth={2} />
                  </div>
                ))}
              </div>
              <button style={{ width:"100%", marginTop:14, padding:"9px", borderRadius:10, border:"1px solid #E5E7EB", background:"transparent", fontSize:11, fontWeight:600, color:"#4F46E5", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                View all activity
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
