import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (server-side: use service role key) ───────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Agent config ─────────────────────────────────────────────────────────
const AGENTS = [
  { name: 'alex',   label: 'Alex — Ads Strategist',          contextKey: 'ads',          webhook: process.env.N8N_ALEX! },
  { name: 'maya',   label: 'Maya — Landing Page Architect',  contextKey: 'landing_page',  webhook: process.env.N8N_MAYA! },
  { name: 'jordan', label: 'Jordan — Welcome Script',        contextKey: 'script1',       webhook: process.env.N8N_JORDAN! },
  { name: 'sam',    label: 'Sam — Lead Magnet Strategist',   contextKey: 'lead_magnet',   webhook: process.env.N8N_SAM! },
  { name: 'casey',  label: 'Casey — Booking Script',         contextKey: 'script2',       webhook: process.env.N8N_CASEY! },
];

// ─── Main handler ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, message, client_name, user_id } = req.body as ChatRequest;

  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id and message are required' });
  }

  try {
    // ── Step 1: Load or create session ──────────────────────────────────
    const session = await getOrCreateSession(session_id, client_name, user_id);
    const { current_agent_index, message, funnel_context } = session;

    // ── Step 2: Check if funnel is already complete ──────────────────────
    if (current_agent_index >= AGENTS.length) {
      return res.status(200).json(buildResponse({
        message: 'Your complete funnel is ready! 🎉 All 5 specialists have finished.',
        agentName: 'system',
        agentLabel: 'LeadFlow',
        isHandoff: false,
        nextAgent: null,
        funnelComplete: true,
        funnelContext: funnel_context,
      }));
    }

    const activeAgent = AGENTS[current_agent_index];

    // ── Step 2.5: Fetch onboarding data from Supabase ───────────────────
    let onboarding_data = null;
    if (user_id) {
      const { data: ob } = await supabase
        .from('accounts_leadflow')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();
      onboarding_data = ob;
    }

    // ── Step 3: Forward to n8n webhook ──────────────────────────────────
    const n8nPayload: N8nPayload = {
      session_id,
      client_name: session.client_name,
      message,
      message,
      funnel_context,
      user_id:         user_id || null,
      onboarding_data: onboarding_data,
    };

    const n8nRes = await callN8n(activeAgent.webhook, n8nPayload);

    if (!n8nRes.ok) {
      console.error(`[api/chat] n8n error ${n8nRes.status} for agent ${activeAgent.name}`);
      return res.status(502).json({ error: 'Agent unavailable, please try again.' });
    }

    // ── Step 4: Parse n8n response ──────────────────────────────────────
    const agentRaw = await n8nRes.json();
    const agentItem = Array.isArray(agentRaw) ? agentRaw[0] : agentRaw;

    const agentMessage = agentItem.message || agentItem.response || '';
    const is_handoff   = agentItem.is_handoff ?? false;
    const agent_output = agentItem.agent_output ?? null;

    // Append both turns to message
    const updatedHistory: Message[] = [
      ...message,
      { role: 'user',      content: message },
      { role: 'assistant', content: agentMessage },
    ];

    // ── Step 5: Handle handoff or continue ──────────────────────────────
    let updatedFunnel = { ...funnel_context };
    let newIndex = current_agent_index;

    if (is_handoff && agent_output) {
      updatedFunnel[activeAgent.contextKey] = agent_output;
      newIndex = current_agent_index + 1;
    }

    // Persist to Supabase
    const { error: dbError } = await supabase
      .from('sessions')
      .update({
        current_agent_index: newIndex,
        message: updatedHistory,
        funnel_context:       updatedFunnel,
        user_id:              user_id || null,
        updated_at:           new Date().toISOString(),
      })
      .eq('session_id', session_id);

    if (dbError) {
      console.error('[api/chat] Supabase update error:', dbError);
    }

    const nextAgent = AGENTS[newIndex] ?? null;
    const funnelComplete = newIndex >= AGENTS.length;

    // ── Step 6: Return to React UI ───────────────────────────────────────
    return res.status(200).json(buildResponse({
      message:       agentMessage,
      agentName:     activeAgent.name,
      agentLabel:    activeAgent.label,
      isHandoff:     is_handoff,
      nextAgent:     nextAgent ? { name: nextAgent.name, label: nextAgent.label } : null,
      funnelComplete,
      funnelContext: funnelComplete ? updatedFunnel : undefined,
    }));

  } catch (err) {
    console.error('[api/chat] Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function getOrCreateSession(session_id: string, client_name?: string, user_id?: string) {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_id', session_id)
    .single();

  if (data) return data;

  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert({
      session_id,
      client_name:          client_name || 'Client',
      current_agent_index:  0,
      message: [],
      funnel_context:       {},
      user_id:              user_id || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return newSession;
}

async function callN8n(webhookUrl: string, payload: N8nPayload) {
  return fetch(webhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    signal:  AbortSignal.timeout(55_000),
  });
}

function buildResponse(opts: BuildResponseOpts) {
  return {
    message:         opts.message,
    agent_name:      opts.agentName,
    agent_label:     opts.agentLabel,
    is_handoff:      opts.isHandoff,
    next_agent:      opts.nextAgent,
    funnel_complete: opts.funnelComplete,
    ...(opts.funnelContext && { funnel_context: opts.funnelContext }),
  };
}
