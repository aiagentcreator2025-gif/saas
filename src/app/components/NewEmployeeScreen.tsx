import { useState } from "react";
import { ArrowLeft, Calendar, Users } from "lucide-react";

interface Props { onBack: () => void; }

const TEAMS = [
  {
    key: "booking", name: "Booking Team", color: "#2563EB", bg: "#EFF6FF",
    desc: "Set up the agent that greets every lead, delivers your lead magnet, and books the call — on autopilot.",
    agents: ["Lead Handler"],
    icon: <Calendar size={22} />,
  },
  {
    key: "followup", name: "Follow-Up Team", color: "#10B981", bg: "#ECFDF5",
    desc: "Configure agents that re-engage cold leads and confirm bookings to maximise show-up rates.",
    agents: ["Follow-Up Automation", "Follow-Up Agent"],
    icon: <Users size={22} />,
  },
];

export function NewEmployeeScreen({ onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 14px", borderRadius: 9,
          border: "1.5px solid #E5E7EB", background: "#fff",
          fontSize: 11, fontWeight: 600, color: "#6B7280",
          marginBottom: 20, cursor: "pointer",
        }}
      >
        <ArrowLeft size={13} /> Back to Dashboard
      </button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 4 }}>New Employee</h2>
        <p style={{ fontSize: 12, color: "#6B7280" }}>Choose a team to configure your AI sales agent.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {TEAMS.map(team => (
          <div
            key={team.key}
            onClick={() => setSelected(team.key)}
            style={{
              padding: "28px 24px", borderRadius: 16,
              border: `2px solid ${selected === team.key ? team.color : "#E5E7EB"}`,
              background: selected === team.key ? team.bg : "#fff",
              cursor: "pointer", transition: "all 0.18s",
              position: "relative", overflow: "hidden",
              boxShadow: selected === team.key ? `0 8px 24px ${team.color}22` : "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg,${team.color},${team.color}99)`,
              opacity: selected === team.key ? 1 : 0, transition: "opacity 0.18s",
            }} />
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: team.bg, color: team.color,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>{team.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 7, color: "#0F1117" }}>{team.name}</div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6, marginBottom: 16 }}>{team.desc}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {team.agents.map(a => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, fontWeight: 500, color: "#6B7280" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: team.color, flexShrink: 0 }} />
                  {a}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <button style={{
          marginTop: 20, width: "100%", padding: "13px",
          borderRadius: 10, border: "none",
          background: "#2563EB", color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
        }}>
          Configure {TEAMS.find(t => t.key === selected)?.name} →
        </button>
      )}
    </div>
  );
}
