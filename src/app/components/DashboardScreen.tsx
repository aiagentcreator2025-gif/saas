import { useState } from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";

const WEEKLY = [12, 28, 18, 45, 32, 58, 41];
const MONTHLY = [120, 180, 145, 210, 190, 240, 195, 280, 220, 260, 300, 275];
const YEARLY = [820, 940, 1100, 1280, 1050, 1400];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = ["2019", "2020", "2021", "2022", "2023", "2024"];

const FLOW_STEPS = [
  { label: "Trigger", sub: "WhatsApp", color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "Script 1", sub: "Welcome", color: "#3B82F6", bg: "#EFF6FF" },
  { label: "Lead Magnet", sub: "Send PDF", color: "#10B981", bg: "#ECFDF5" },
  { label: "Script 2", sub: "Follow-up", color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Booking", sub: "Schedule", color: "#EF4444", bg: "#FFF1F2" },
];

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
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Good {greeting}! 👋
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280" }}>Here's your LeadFlow performance overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: s.gradient, borderRadius: 20, padding: "24px 22px",
            position: "relative", overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", cursor: "pointer", transition: "transform 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <div style={{ position: "absolute", bottom: -30, left: -10, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.3)", padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#fff" }}>
                <TrendingUp size={9} />{s.change}
              </div>
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-2px", marginBottom: 6, position: "relative" }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", position: "relative" }}>{s.label}</div>
            <div style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={13} color="#fff" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F1117", marginBottom: 2 }}>Performance Overview</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Leads through your flow</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["weekly", "monthly", "yearly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "5px 12px", borderRadius: 8, border: "none",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: period === p ? "#6366F1" : "#F3F4F6",
                  color: period === p ? "#fff" : "#6B7280", transition: "all 0.15s",
                }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180 }}>
            {data.map((val, i) => {
              const h = Math.max(8, Math.round((val / maxVal) * 160));
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: "100%", height: h,
                    background: i === data.indexOf(maxVal) ? "linear-gradient(180deg,#818CF8,#6366F1)" : "linear-gradient(180deg,#E0E7FF,#C7D2FE)",
                    borderRadius: "6px 6px 0 0", transition: "all 0.3s",
                    boxShadow: i === data.indexOf(maxVal) ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                  }} />
                  <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 500 }}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1117", marginBottom: 4 }}>Your Lead Flow</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 18 }}>Current automation sequence</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {FLOW_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <div style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${step.color}33`, background: step.bg, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, flexShrink: 0, boxShadow: `0 0 6px ${step.color}66` }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1117" }}>{step.label}</div>
                    <div style={{ fontSize: 9, color: "#6B7280" }}>{step.sub}</div>
                  </div>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div style={{ width: 2, height: 16, background: "linear-gradient(180deg,#E5E7EB,#D1D5DB)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
