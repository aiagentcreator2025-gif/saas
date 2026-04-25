import { useState } from "react";
import { TrendingUp, ArrowUpRight, Clock, CheckSquare } from "lucide-react";

const WEEKLY = [12, 28, 18, 45, 32, 58, 41];
const MONTHLY = [120, 180, 145, 210, 190, 240, 195, 280, 220, 260, 300, 275];
const YEARLY = [820, 940, 1100, 1280, 1050, 1400];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = ["2019", "2020", "2021", "2022", "2023", "2024"];

const ACTIVITIES = [
  { name: "Ahmed Karimi", action: "booked a call", time: "2 min ago" },
  { name: "Sara Moreira", action: "received lead magnet", time: "15 min ago" },
  { name: "John Davidson", action: "booked a call", time: "1 hour ago" },
  { name: "Maria Santos", action: "entered the flow", time: "2 hours ago" },
  { name: "Chris Lee", action: "no-showed the call", time: "3 hours ago" },
];

const LEADS = [
  { name: "Ahmed Karimi", step: "Booking", status: "booked", date: "Apr 25" },
  { name: "Sara Moreira", step: "Lead Magnet", status: "magnet_sent", date: "Apr 24" },
  { name: "John Davidson", step: "Booking", status: "booked", date: "Apr 24" },
  { name: "Maria Santos", step: "Script 1", status: "new", date: "Apr 23" },
  { name: "Chris Lee", step: "Booking", status: "no_show", date: "Apr 22" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  booked: { label: "Booked", color: "#6366F1", bg: "#EEF2FF" },
  magnet_sent: { label: "Magnet Sent", color: "#10B981", bg: "#ECFDF5" },
  new: { label: "New", color: "#3B82F6", bg: "#EFF6FF" },
  no_show: { label: "No Show", color: "#EF4444", bg: "#FFF1F2" },
};

export function DashboardScreen() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const data = period === "weekly" ? WEEKLY : period === "monthly" ? MONTHLY : YEARLY;
  const labels = period === "weekly" ? DAYS : period === "monthly" ? MONTHS : YEARS;
  const maxVal = Math.max(...data);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  })();

  const stats = [
    { label: "Leads Handled", value: "142", change: "+18%", gradient: "linear-gradient(135deg,#C4B5FD 0%,#A78BFA 50%,#8B5CF6 100%)", icon: "👥" },
    { label: "Lead Magnet Sent", value: "98", change: "+12%", gradient: "linear-gradient(135deg,#67E8F9 0%,#22D3EE 50%,#06B6D4 100%)", icon: "📩" },
    { label: "Booked Calls", value: "34", change: "+8%", gradient: "linear-gradient(135deg,#FCA5A5 0%,#F87171 50%,#EF4444 100%)", icon: "📅" },
    { label: "Show Up Rate", value: "76%", change: "+5%", gradient: "linear-gradient(135deg,#86EFAC 0%,#4ADE80 50%,#22C55E 100%)", icon: "✅" },
  ];

  return (
    <div style={{ padding: "36px 40px", width: "100%", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Good {greeting}! 👋
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280" }}>Here's your LeadFlow performance overview</p>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: s.gradient,
            borderRadius: 24, padding: "28px 24px",
            position: "relative", overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
            cursor: "pointer", transition: "transform 0.2s",
            minHeight: 170,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}
          >
            <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
            <div style={{ position: "absolute", bottom: -40, left: -10, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />

            {/* Icon + View details */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
              <button style={{
                padding: "5px 13px", borderRadius: 20,
                background: "rgba(255,255,255,0.88)",
                border: "none", fontSize: 11, fontWeight: 600,
                color: "#374151", cursor: "pointer",
              }}>
                View details
              </button>
            </div>

            {/* Value + Label */}
            <div style={{ fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-2px", marginBottom: 6, position: "relative" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", position: "relative" }}>
              {s.label}
            </div>

            {/* Trend */}
            <div style={{
              position: "absolute", bottom: 18, right: 18,
              display: "flex", alignItems: "center", gap: 3,
              background: "rgba(255,255,255,0.25)",
              padding: "4px 10px", borderRadius: 20,
              fontSize: 11, fontWeight: 700, color: "#fff",
            }}>
              <TrendingUp size={10} />{s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Middle: Chart (2/3) + Recent Activities (1/3) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Chart */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", padding: "26px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F1117", marginBottom: 3 }}>Performance Overview</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>Leads through your flow</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["weekly", "monthly", "yearly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "6px 14px", borderRadius: 9, border: "none",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: period === p ? "#6366F1" : "#F3F4F6",
                  color: period === p ? "#fff" : "#6B7280",
                  transition: "all 0.15s",
                }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200 }}>
            {data.map((val, i) => {
              const h = Math.max(10, Math.round((val / maxVal) * 180));
              const isMax = i === data.indexOf(maxVal);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: "100%", height: h,
                    background: isMax
                      ? "linear-gradient(180deg,#818CF8,#6366F1)"
                      : "linear-gradient(180deg,#E0E7FF,#C7D2FE)",
                    borderRadius: "8px 8px 0 0",
                    transition: "all 0.3s",
                    boxShadow: isMax ? "0 6px 16px rgba(99,102,241,0.4)" : "none",
                  }} />
                  <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", padding: "26px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={15} color="#6B7280" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F1117" }}>Recent Activities</div>
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 18, paddingLeft: 42 }}>Showing all latest activities</div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {ACTIVITIES.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "11px 0",
                borderBottom: i < ACTIVITIES.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#6366F1", flexShrink: 0,
                }}>
                  {a.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#0F1117", lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    {" "}<span style={{ color: "#6B7280" }}>{a.action}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          <button style={{
            width: "100%", marginTop: 16, padding: "10px",
            borderRadius: 10, border: "1px solid #E5E7EB",
            background: "#FAFBFE", fontSize: 11, fontWeight: 600,
            color: "#6366F1", cursor: "pointer",
          }}>
            View All Activity
          </button>
        </div>
      </div>

      {/* Bottom: Recent Leads Table */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckSquare size={16} color="#6B7280" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F1117" }}>Recent Leads</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Latest leads in your pipeline</div>
            </div>
          </div>
          <button style={{
            padding: "8px 18px", borderRadius: 10,
            border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}>
            <ArrowUpRight size={14} /> View All
          </button>
        </div>

        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "11px 28px", background: "#FAFBFE", borderBottom: "1px solid #F3F4F6" }}>
          {["Lead Name", "Flow Step", "Status", "Date"].map(col => (
            <div key={col} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col}</div>
          ))}
        </div>

        {/* Table Rows */}
        {LEADS.map((lead, i) => {
          const s = STATUS_CONFIG[lead.status];
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
              padding: "15px 28px",
              borderBottom: i < LEADS.length - 1 ? "1px solid #F3F4F6" : "none",
              transition: "background 0.12s", cursor: "pointer",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FAFBFE"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#6366F1", flexShrink: 0,
                }}>
                  {lead.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F1117" }}>{lead.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#374151" }}>{lead.step}</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: "4px 11px", borderRadius: 20 }}>{s.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#9CA3AF" }}>{lead.date}</div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
