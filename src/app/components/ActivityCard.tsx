import { CalendarDays } from "lucide-react";

export function ActivityCard() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #E5E7EB",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid #F3F4F6",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F1117" }}>Recent Activities</span>
        <button style={{
          width: 24, height: 24, borderRadius: 6,
          border: "1px solid #E5E7EB", background: "#fff",
          fontSize: 12, color: "#9CA3AF", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>⋯</button>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "40px 20px", textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#EFF6FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
        }}>
          <CalendarDays size={24} color="#2563EB" />
        </div>
        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Book your first slot today</p>
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>to see your lead activity</p>
      </div>
    </div>
  );
}
