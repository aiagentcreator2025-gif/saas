import { useState } from "react";
import { Users, ChevronDown, Plus } from "lucide-react";

interface Props {
  onNewEmployee: () => void;
}

const TEAMS = [
  {
    key: "booking",
    name: "Booking Team",
    color: "#2563EB",
    bg: "#EFF6FF",
    agents: [
      { name: "Lead Handler", desc: "Welcomes leads, delivers the lead magnet, then books the call.", live: true },
    ],
  },
  {
    key: "followup",
    name: "Follow-Up Team",
    color: "#10B981",
    bg: "#ECFDF5",
    agents: [
      { name: "Follow-Up Automation", desc: "Re-engages cold leads until they book — automatically.", live: false },
      { name: "Follow-Up Agent", desc: "Confirms bookings and follows up to ensure show-ups.", live: false },
    ],
  },
];

export function EmployeeSection({ onNewEmployee }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ booking: true, followup: true });

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid #F3F4F6" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1117" }}>My Employees</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>Your AI sales teams</div>
        </div>
        <button
          onClick={onNewEmployee}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 13px", borderRadius: 8,
            background: "#EFF6FF", color: "#2563EB",
            border: "1px solid #BFDBFE",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={11} /> Add Agent
        </button>
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {TEAMS.map(team => (
          <div key={team.key} style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <div
              onClick={() => setOpen(p => ({ ...p, [team.key]: !p[team.key] }))}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", background: "#FAFBFE", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 8, background: team.bg, color: team.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={12} />
              </div>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#0F1117" }}>{team.name}</span>
              <span style={{ fontSize: 10, color: "#6B7280", background: "#E5E7EB", padding: "2px 9px", borderRadius: 20, fontWeight: 600 }}>{team.agents.length} agent{team.agents.length !== 1 ? "s" : ""}</span>
              <ChevronDown size={14} color="#9CA3AF" style={{ transition: "transform 0.2s", transform: open[team.key] ? "rotate(180deg)" : "rotate(0)" }} />
            </div>

            {open[team.key] && (
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7, borderTop: "1px solid #E5E7EB" }}>
                {team.agents.map(agent => (
                  <div key={agent.name} style={{
                    borderRadius: 8,
                    border: `1.5px solid ${agent.live ? "rgba(37,99,235,0.22)" : "#E5E7EB"}`,
                    padding: "13px 15px",
                    background: agent.live ? "linear-gradient(145deg,#FAFBFE,#EFF6FF)" : "#FAFBFE",
                    position: "relative", overflow: "hidden",
                  }}>
                    {agent.live && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#2563EB,#60A5FA)" }} />}
                    {agent.live && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 600, color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", padding: "2px 8px", borderRadius: 20, marginBottom: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "blink 1.4s ease infinite", display: "inline-block" }} />
                        Live
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1117", marginBottom: 3 }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.5, marginBottom: agent.live ? 10 : 0 }}>{agent.desc}</div>
                    {agent.live && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ padding: "5px 11px", borderRadius: 7, background: "#2563EB", color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>Preview workflow</button>
                        <button style={{ padding: "5px 11px", borderRadius: 7, background: "#F9FAFB", color: "#0F1117", border: "1px solid #E5E7EB", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Connect</button>
                      </div>
                    )}
                    {!agent.live && (
                      <button onClick={onNewEmployee} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "5px 11px", borderRadius: 7, background: "#F9FAFB", color: "#6B7280", border: "1.5px dashed #D1D5DB", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                        <Plus size={10} /> Build this agent
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}
