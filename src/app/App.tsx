import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardScreen } from "./components/DashboardScreen";
import { LeadFlowScreen } from "./components/LeadFlowScreen";
import { CalendarScreen } from "./components/CalendarScreen";
import { LeadListScreen } from "./components/LeadListScreen";

export type Screen = "dashboard" | "leadflow" | "calendar" | "leadlist";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8F9FC", fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      <Sidebar active={screen} onNav={setScreen} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {screen === "dashboard" && <DashboardScreen />}
        {screen === "leadflow" && <LeadFlowScreen />}
        {screen === "calendar" && <CalendarScreen />}
        {screen === "leadlist" && <LeadListScreen />}
      </div>
    </div>
  );
}
