import { useState } from "react";
import { LeadFlowSidebar } from "./components/LeadFlowSidebar";
import { StatCard } from "./components/StatCard";
import { AnalyticsChart } from "./components/AnalyticsChart";
import { EmployeeSection } from "./components/EmployeeSection";
import { ActivityCard } from "./components/ActivityCard";
import { CalendarScreen, BookingFormScreen, SettingsScreen } from "./components/CalendarScreen";
import { NewEmployeeScreen } from "./components/NewEmployeeScreen";
import { Bell, Plus } from "lucide-react";

export type Screen = "dashboard" | "new-employee" | "calendar" | "booking-form" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  });

  const screenTitles: Record<Screen, string> = {
    dashboard: "Dashboard",
    "new-employee": "New Employee",
    calendar: "Calendar",
    "booking-form": "Booking Form",
    settings: "Settings",
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F6FA", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      <LeadFlowSidebar active={screen} onNav={setScreen} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9CA3AF" }}>
            <span>Home</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: "#0F1117", fontWeight: 600 }}>{screenTitles[screen]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setScreen("settings")}
              style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #E5E7EB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
            >
              <Bell size={15} color="#6B7280" />
              <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#2563EB", border: "1.5px solid #fff" }} />
            </button>
            <button
              onClick={() => setScreen("new-employee")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "#2563EB", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
            >
              <Plus size={13} />
              New Employee
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          {screen === "dashboard" && <DashboardScreen greeting={greeting} onNav={setScreen} />}
          {screen === "new-employee" && <NewEmployeeScreen onBack={() => setScreen("dashboard")} />}
          {screen === "calendar" && <CalendarScreen />}
          {screen === "booking-form" && <BookingFormScreen />}
          {screen === "settings" && <SettingsScreen />}
        </div>
      </div>
    </div>
  );
}

function DashboardScreen({ greeting, onNav }: { greeting: string; onNav: (s: Screen) => void }) {
  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Good {greeting}! 👋
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280" }}>Here's what's happening with your leads today</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 22 }}>
        <StatCard title="Total Leads" value="0" subtitle="No leads yet" color="purple" />
        <StatCard title="Active Bookings" value="1" subtitle="1 booking in progress" trend="up" trendValue="+12%" color="green" />
        <StatCard title="Conversion Rate" value="100%" subtitle="Great performance!" trend="up" trendValue="+5%" color="pink" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, marginBottom: 22 }}>
        <AnalyticsChart />
        <ActivityCard />
      </div>
      <EmployeeSection onNewEmployee={() => onNav("new-employee")} />
    </div>
  );
}
