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
    // use getSession instead of getUser — instant, no network hang
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAuthState("unauthenticated");
        return;
      }
      await checkAccount(session.user.id);
    };

    init();

    // listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setAuthState("unauthenticated");
        return;
      }
      await checkAccount(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAccount = async (userId: string) => {
    try {
      const { data: account } = await supabase
        .from("accounts_leadflow")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();
      if (!account || !account.onboarding_completed) {
        setAuthState("onboarding");
      } else {
        setAuthState("ready");
      }
    } catch {
      setAuthState("onboarding");
    }
  };

  // timeout fallback — if still loading after 5s, force unauthenticated
  useEffect(() => {
    if (authState !== "loading") return;
    const timer = setTimeout(() => setAuthState("unauthenticated"), 5000);
    return () => clearTimeout(timer);
  }, [authState]);

  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9F9F8", fontFamily: "'DM Sans', sans-serif", color: "#8A8680", fontSize: 13 }}>
      Loading...
    </div>
  );

  if (authState === "unauthenticated") return <AuthScreen onAuth={() => supabase.auth.getSession().then(({ data: { session } }) => session && checkAccount(session.user!.id))} />;
  if (authState === "onboarding") return <OnboardingScreen onComplete={() => supabase.auth.getSession().then(({ data: { session } }) => session && checkAccount(session.user!.id))} />;

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
