import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Send } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CLIENT_ID = "1fc97cde-dfd6-47ec-b3cb-932abb919142";

interface Lead {
  id: string;
  name: string | null;
  whatsapp_number: string;
  status: string;
}

interface Message {
  id: string;
  content: string;
  direction: "inbound" | "outbound";
  sent_at: string;
}

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .lead-row:hover { background: #F7F6F3 !important; }
  .send-btn:hover { opacity: .8; }
`;

export function ConversationScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load leads
  useEffect(() => {
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("CLIENT_ID:", CLIENT_ID);
    supabase
      .from("leads")
      .select("id, name, whatsapp_number, status")
      .eq("client_id", CLIENT_ID)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        console.log("leads data:", data);
        console.log("leads error:", error);
        if (data) setLeads(data);
      });
  }, []);

  // Load conversation + messages when lead selected
  useEffect(() => {
    if (!selectedLead) return;
    setMessages([]);
    setConversationId(null);

    supabase
      .from("conversations")
      .select("id")
      .eq("lead_id", selectedLead.id)
      .single()
      .then(({ data, error }) => {
        console.log("conversation data:", data);
        console.log("conversation error:", error);
        if (!data) return;
        setConversationId(data.id);
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", data.id)
          .order("sent_at", { ascending: true })
          .then(({ data: msgs, error: msgsError }) => {
            console.log("messages data:", msgs);
            console.log("messages error:", msgsError);
            if (msgs) setMessages(msgs);
          });
      });
  }, [selectedLead]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel("messages-" + conversationId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    new:          { color: "#378ADD", bg: "#E6F1FB" },
    magnet_sent:  { color: "#1D9E75", bg: "#E1F5EE" },
    booked:       { color: "#4A46B5", bg: "#EEEDF8" },
    no_show:      { color: "#D85A30", bg: "#FAECE7" },
    follow_up:    { color: "#BA7517", bg: "#FDF3E1" },
  };

  const initials = (lead: Lead) =>
    (lead.name || lead.whatsapp_number).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#F9F9F8" }}>

        {/* Left panel — lead list */}
        <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid #E8E6E0", background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 20px 14px" }}>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 400, color: "#1A1916", letterSpacing: "-0.4px", marginBottom: 2 }}>Conversations</h1>
            <p style={{ fontSize: 11, color: "#8A8680", fontWeight: 300, fontStyle: "italic" }}>{leads.length} leads</p>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {leads.map(lead => {
              const s = STATUS_COLORS[lead.status] || { color: "#8A8680", bg: "#F2F1EE" };
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  className={isSelected ? "" : "lead-row"}
                  onClick={() => setSelectedLead(lead)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: isSelected ? "#EEEDF8" : "transparent", borderBottom: "1px solid #F2F1EE", transition: "background .14s" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isSelected ? "#4A46B5" : "#F2F1EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: isSelected ? "#fff" : "#8A8680", flexShrink: 0 }}>
                    {initials(lead)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? "#4A46B5" : "#1A1916", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lead.name || lead.whatsapp_number}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 400, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 20 }}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
            {leads.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "#8A8680", fontSize: 12, fontStyle: "italic" }}>No leads yet</div>
            )}
          </div>
        </div>

        {/* Right panel — chat */}
        {selectedLead ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E8E6E0", background: "#FFFFFF", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#EEEDF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "#4A46B5" }}>
                {initials(selectedLead)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1916" }}>{selectedLead.name || selectedLead.whatsapp_number}</div>
                <div style={{ fontSize: 11, color: "#8A8680", fontWeight: 300 }}>{selectedLead.whatsapp_number}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#C4C2BC", fontSize: 12, fontStyle: "italic", marginTop: 40 }}>No messages yet</div>
              )}
              {messages.map(msg => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isOutbound ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "65%", padding: "9px 14px", borderRadius: isOutbound ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isOutbound ? "#1A1916" : "#FFFFFF", border: isOutbound ? "none" : "1px solid #E8E6E0", fontSize: 13, color: isOutbound ? "#fff" : "#1A1916", fontWeight: 300, lineHeight: 1.5 }}>
                      {msg.content}
                      <div style={{ fontSize: 9, color: isOutbound ? "rgba(255,255,255,.45)" : "#C4C2BC", marginTop: 4, textAlign: "right" }}>
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #E8E6E0", background: "#FFFFFF", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); } }} placeholder="Type a message..." rows={1} style={{ flex: 1, padding: "10px 14px", border: "1px solid #E8E6E0", borderRadius: 10, fontSize: 13, color: "#1A1916", background: "#F9F9F8", outline: "none", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, resize: "none", lineHeight: 1.5 }} />
              <button className="send-btn" style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "#1A1916", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "opacity .15s" }}>
                <Send size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#C4C2BC", fontSize: 13, fontStyle: "italic" }}>
            Select a lead to view the conversation
          </div>
        )}
      </div>
    </>
  );
}
