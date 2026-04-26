import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardScreen } from "./components/DashboardScreen";
import { LeadFlowScreen } from "./components/LeadFlowScreen";
import { CalendarScreen, BookingFormScreen, SettingsScreen } from "./components/CalendarScreen";
import { LeadListScreen } from "./components/LeadListScreen";
import { ConversationScreen } from "./components/ConversationScreen";

export type Screen = "dashboard" | "leadflow" | "calendar" | "booking-form" | "settings" | "leadlist" | "conversations";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F6FA", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      <Sidebar active={screen} onNav={setScreen} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {screen === "dashboard" && <DashboardScreen />}
        {screen === "leadflow" && <LeadFlowScreen />}
        {screen === "calendar" && <CalendarScreen />}
        {screen === "booking-form" && <BookingFormScreen />}
        {screen === "settings" && <SettingsScreen />}
        {screen === "leadlist" && <LeadListScreen />}
        {screen === "conversations" && <ConversationScreen />}
      </div>
    </div>
  );
}
