import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Send } from "lucide-react";

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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  .lead-row:hover { background: #F3F4F6 !important; }
  .send-btn:hover { background: #4338CA !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
`;

export function ConversationScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("account_leadflow_automations")
        .select("client_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data?.client_id) setClientId(data.client_id);
    };
    load();
  }, []);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from("leads")
      .select("id, name, whatsapp_number, status")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setLeads(data); });
  }, [clientId]);

  useEffect(() => {
    if (!selectedLead) return;
    setMessages([]);
    setConversationId(null);
    supabase
      .from("conversations")
      .select("id")
      .eq("lead_id", selectedLead.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setConversationId(data.id);
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", data.id)
          .order("sent_at", { ascending: true })
          .then(({ data: msgs }) => { if (msgs) setMessages(msgs); });
      });
  }, [selectedLead]);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    new:         { color: "#2563EB", bg: "#EFF6FF" },
    magnet_sent: { color: "#059669", bg: "#ECFDF5" },
    booked:      { color: "#4F46E5", bg: "#EEF2FF" },
    no_show:     { color: "#DC2626", bg: "#FEF2F2" },
    follow_up:   { color: "#D97706", bg: "#FFFBEB" },
  };

  const initials = (lead: Lead) =>
    (lead.name || lead.whatsapp_number).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ display:"flex", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#EDEEF5" }}>

        {/* ── Lead list sidebar ── */}
        <div style={{ width:280, flexShrink:0, background:"#FFFFFF", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"24px 20px 14px" }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:"#111827", letterSpacing:"-0.4px", marginBottom:2 }}>Conversations</h1>
            <p style={{ fontSize:12, color:"#9CA3AF" }}>{leads.length} leads</p>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {leads.map(lead => {
              const s = STATUS_COLORS[lead.status] || { color:"#6B7280", bg:"#F3F4F6" };
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  className={isSelected ? "" : "lead-row"}
                  onClick={() => setSelectedLead(lead)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", background: isSelected ? "#EEF2FF" : "transparent", borderBottom:"1px solid #F3F4F6", transition:"background .14s" }}
                >
                  <div style={{ width:36, height:36, borderRadius:"50%", background: isSelected ? "#4F46E5" : "#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color: isSelected ? "#fff" : "#6B7280", flexShrink:0 }}>
                    {initials(lead)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: isSelected ? "#4F46E5" : "#111827", marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {lead.name || lead.whatsapp_number}
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color:s.color, background:s.bg, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.4px" }}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
            {leads.length === 0 && (
              <div style={{ padding:32, textAlign:"center", color:"#9CA3AF", fontSize:12 }}>
                {clientId ? "No leads yet" : "Connecting..."}
              </div>
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        {selectedLead ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#EDEEF5" }}>

            {/* Header */}
            <div style={{ padding:"16px 24px", background:"#FFFFFF", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#4F46E5" }}>
                {initials(selectedLead)}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{selectedLead.name || selectedLead.whatsapp_number}</div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>{selectedLead.whatsapp_number}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign:"center", color:"#D1D5DB", fontSize:12, marginTop:40 }}>No messages yet</div>
              )}
              {messages.map(msg => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div key={msg.id} style={{ display:"flex", justifyContent: isOutbound ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth:"65%", padding:"10px 14px", borderRadius: isOutbound ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isOutbound ? "#4F46E5" : "#FFFFFF", border: isOutbound ? "none" : "1px solid #E5E7EB", fontSize:13, fontWeight: isOutbound ? 500 : 400, color: isOutbound ? "#fff" : "#111827", lineHeight:1.6, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                      {msg.content}
                      <div style={{ fontSize:9, color: isOutbound ? "rgba(255,255,255,.5)" : "#D1D5DB", marginTop:4, textAlign:"right" }}>
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:"14px 24px", borderTop:"1px solid #E5E7EB", background:"#FFFFFF", display:"flex", gap:10, alignItems:"flex-end" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); }}}
                placeholder="Type a message..."
                rows={1}
                style={{ flex:1, padding:"10px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:13, color:"#111827", background:"#F9FAFB", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", resize:"none", lineHeight:1.5, transition:"border-color .15s" }}
              />
              <button className="send-btn" style={{ width:38, height:38, borderRadius:10, border:"none", background:"#4F46E5", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"background .15s" }}>
                <Send size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#D1D5DB", fontSize:13 }}>
            Select a lead to view the conversation
          </div>
        )}

      </div>
    </>
  );
}
