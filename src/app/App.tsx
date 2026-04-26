import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Sidebar } from "./components/Sidebar";
import { DashboardScreen } from "./components/DashboardScreen";
import { LeadFlowScreen } from "./components/LeadFlowScreen";
import { CalendarScreen, BookingFormScreen, SettingsScreen } from "./components/CalendarScreen";
import { LeadListScreen } from "./components/LeadListScreen";
import { ConversationScreen } from "./components/ConversationScreen";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type Screen = "dashboard" | "leadflow" | "calendar" | "booking-form" | "settings" | "leadlist" | "conversations";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [authState, setAuthState] = useState<"loading" | "unauthenticated" | "onboarding" | "ready">("loading");

  useEffect(() => {
    checkAuth();
    supabase.auth.onAuthStateChange(() => checkAuth());
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAuthState("unauthenticated"); return; }
    const { data: account } = await supabase
      .from("accounts_leadflow")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();
    if (!account || !account.onboarding_completed) {
      setAuthState("onboarding");
    } else {
      setAuthState("ready");
    }
  };

  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9F9F8", fontFamily: "'DM Sans', sans-serif", color: "#8A8680", fontSize: 13 }}>
      Loading...
    </div>
  );

  if (authState === "unauthenticated") return <AuthScreen onAuth={checkAuth} />;
  if (authState === "onboarding") return <OnboardingScreen onComplete={checkAuth} />;

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
