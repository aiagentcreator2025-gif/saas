import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function NotificationPopup({ userId }: { userId: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [notifId, setNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (event) => {
        if (event.new.html) {
          setHtml(event.new.html);
          setNotifId(event.new.id);
          setVisible(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const dismiss = async () => {
    if (notifId) {
      await supabase.from("notifications").update({ read: true }).eq("id", notifId);
    }
    setVisible(false);
  };

  useEffect(() => {
    (window as any).dismissNotif = dismiss;
  }, [notifId]);

  if (!visible || !html) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px",
        width: "100%", maxWidth: 420, border: "0.5px solid #e5e5e5"
      }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
