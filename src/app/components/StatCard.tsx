import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "purple" | "green" | "pink";
}

const COLORS = {
  purple: { bg: "linear-gradient(145deg,#F5F3FF 0%,#EDE9FE 60%,#DDD6FE 100%)", blob: "rgba(167,139,250,0.25)", border: "#DDD6FE", icon: "#7C3AED" },
  green:  { bg: "linear-gradient(145deg,#ECFDF5 0%,#D1FAE5 60%,#A7F3D0 100%)", blob: "rgba(52,211,153,0.22)", border: "#A7F3D0", icon: "#059669" },
  pink:   { bg: "linear-gradient(145deg,#FFF1F2 0%,#FFE4E6 60%,#FECDD3 100%)", blob: "rgba(251,113,133,0.22)", border: "#FECDD3", icon: "#E11D48" },
};

export function StatCard({ title, value, subtitle, trend, trendValue, color = "purple" }: StatCardProps) {
  const c = COLORS[color];
  return (
    <div style={{
      background: c.bg,
      borderRadius: 16,
      padding: "22px 24px",
      border: `1px solid ${c.border}`,
      position: "relative",
      overflow: "hidden",
      minHeight: 130,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        position: "absolute", right: -20, top: -20,
        width: 130, height: 130, borderRadius: "50%",
        background: c.blob,
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.5)", letterSpacing: "0.05em" }}>{title}</span>
        {trend && trendValue && (
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 10, fontWeight: 700,
            color: trend === "up" ? "#059669" : "#DC2626",
            background: trend === "up" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)",
            padding: "3px 8px", borderRadius: 20,
          }}>
            {trend === "up" ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
            {trendValue}
          </div>
        )}
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 38, fontWeight: 800, color: "rgba(0,0,0,0.72)", lineHeight: 1, letterSpacing: "-2px", marginBottom: 4 }}>{value}</div>
        {subtitle && <div style={{ fontSize: 11, color: "rgba(0,0,0,0.42)", fontWeight: 500 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
