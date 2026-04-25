import { Home, Users, Calendar, FileText, BarChart2, Settings, LogOut } from "lucide-react";
import { Screen } from "../App";

interface Props {
  active: Screen;
  onNav: (s: Screen) => void;
}

export function LeadFlowSidebar({ active, onNav }: Props) {
  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #E5E7EB",
      display: "flex", flexDirection: "column",
      height: "100vh",
    }}>
      <div style={{ padding: "20px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 34, height: 34,
            background: "#2563EB",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.3px" }}>LeadFlow</span>
        </div>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
            width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
            <circle cx="7" cy="7" r="5"/><path d="M12 12l2.5 2.5"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
            style={{
              width: "100%", padding: "8px 10px 8px 30px",
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              borderRadius: 8, fontSize: 12, color: "#374151",
              outline: "none",
            }}
          />
        </div>
      </div>

      <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
        <NavLabel>Main</NavLabel>
        <NavItem icon={<Home size={15}/>} label="Dashboard" active={active === "dashboard"} onClick={() => onNav("dashboard")} />
        <NavItem icon={<Users size={15}/>} label="New Employee" active={active === "new-employee"} onClick={() => onNav("new-employee")} />
        <NavItem icon={<Calendar size={15}/>} label="Calendar" active={active === "calendar"} onClick={() => onNav("calendar")} />
        <NavItem icon={<FileText size={15}/>} label="Booking Form" active={active === "booking-form"} onClick={() => onNav("booking-form")} />
        <div style={{ height: 1, background: "#F3F4F6", margin: "10px 0" }} />
        <NavLabel>Analytics</NavLabel>
        <NavItem icon={<BarChart2 size={15}/>} label="Leads" active={false} onClick={() => {}} />
        <NavItem icon={<BarChart2 size={15}/>} label="Reports" active={false} onClick={() => {}} />
      </nav>

      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid #F3F4F6" }}>
        <NavItem icon={<Settings size={15}/>} label="Settings" active={active === "settings"} onClick={() => onNav("settings")} />
        <NavItem icon={<LogOut size={15}/>} label="Sign out" active={false} onClick={() => {}} />
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: "#EFF6FF", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>U</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F1117" }}>Account</div>
            <div style={{ fontSize: 10, color: "#6B7280" }}>user@leadflow.io</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.9px", padding: "0 8px", margin: "10px 0 4px" }}>
      {children}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 9,
        fontSize: 12, fontWeight: active ? 600 : 500,
        color: active ? "#2563EB" : "#4B5563",
        background: active ? "#EFF6FF" : "transparent",
        cursor: "pointer", marginBottom: 1, transition: "all 0.14s",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
      {label}
    </div>
  );
}
