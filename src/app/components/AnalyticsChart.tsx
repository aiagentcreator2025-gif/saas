import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATA = [20, 45, 30, 60, 40, 70, 55];

export function AnalyticsChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...DATA);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #E5E7EB",
      padding: "20px 22px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1117", marginBottom: 3 }}>Analytics</div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>Weekly leads overview</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{
            padding: "5px 13px", borderRadius: 8,
            background: "#0F1117", color: "#fff",
            border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
          }}>Last Week</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
        {DATA.map((val, i) => {
          const h = Math.max(8, Math.round((val / maxVal) * 140));
          const isHovered = hovered === i;
          const isMax = val === maxVal;
          return (
            <div
              key={i}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <div style={{
                  background: "#0F1117", color: "#fff",
                  padding: "5px 10px", borderRadius: 8,
                  fontSize: 10, fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  marginBottom: 2,
                }}>
                  {DAYS[i]}: {val} leads
                </div>
              )}
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                <div style={{
                  width: "100%", height: h,
                  background: isMax || isHovered
                    ? "linear-gradient(180deg,#3B82F6,#2563EB)"
                    : "#E5E7EB",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  boxShadow: isMax || isHovered ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                }} />
              </div>
              <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 500 }}>{DAYS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
