import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardScreen } from "./components/DashboardScreen";
import { LeadFlowScreen } from "./components/LeadFlowScreen";
import { CalendarScreen, BookingFormScreen, SettingsScreen } from "./components/CalendarScreen";
import { LeadListScreen } from "./components/LeadListScreen";
import { ConversationScreen } from "./components/ConversationScreen";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { supabase } from "./supabaseClient";

export type Screen = "dashboard" | "leadflow" | "calendar" | "booking-form" | "settings" | "leadlist" | "conversations";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [authState, setAuthState] = useState<"loading" | "unauthenticated" | "onboarding" | "ready">("loading");

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
  try {
    console.log("checkAuth started");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("user:", user, "error:", userError);
    if (!user) { setAuthState("unauthenticated"); return; }
    console.log("fetching account for user:", user.id);
    const { data: account, error: accountError } = await supabase
      .from("accounts_leadflow")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();
    console.log("account:", account, "error:", accountError);
    if (!account || !account.onboarding_completed) {
      setAuthState("onboarding");
    } else {
      setAuthState("ready");
    }
  } catch (e) {
    console.log("checkAuth error:", e);
    setAuthState("unauthenticated");
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
