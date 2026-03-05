import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MAPS_API_KEY = Deno.env.get("MAPS_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use SERVICE_ROLE_KEY to bypass RLS — this is server-side, safe to use
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    const { title, proposed_start_time, location, user_id, category } = await req.json();

    if (!title || !proposed_start_time || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. GET ESTIMATED DURATION VIA GEMINI
    let estimatedMinutes = 30;
    try {
      const geminiPrompt = `Analyze the task: "${title}" (category: ${category}). Return ONLY a JSON object like {"minutes": 45}. Give a realistic duration estimate in minutes. Do not explain.`;
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
          }),
        }
      );
      
      const geminiData = await geminiRes.json();
      const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.minutes && typeof parsed.minutes === 'number') {
        estimatedMinutes = parsed.minutes;
      }
    } catch (e) {
      console.warn("Gemini prediction failed, using default 30 mins", e);
    }

    const startDateTime = new Date(proposed_start_time);
    const endDateTime = new Date(startDateTime.getTime() + estimatedMinutes * 60000);

    // 2. FETCH TODAY'S TASKS FOR CONFLICT CHECK
    const startOfDay = new Date(startDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`[conflict-engine] Checking conflicts for user ${user_id}, date ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const { data: todaysTasks, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("[conflict-engine] DB query error:", error);
      throw error;
    }

    console.log(`[conflict-engine] Found ${todaysTasks?.length || 0} existing tasks for today`);

    let hasConflict = false;
    let conflictWarning = null;

    if (todaysTasks && todaysTasks.length > 0) {
      for (const t of todaysTasks) {
        if (!t.start_time || !t.end_time) continue;
        
        const existingStart = new Date(t.start_time);
        const existingEnd = new Date(t.end_time);

        // Time Overlap Check: new task overlaps with existing task
        if (startDateTime < existingEnd && endDateTime > existingStart) {
          hasConflict = true;
          const existingStartStr = existingStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const existingEndStr = existingEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          conflictWarning = `Conflito com "${t.title}" (${existingStartStr} - ${existingEndStr}). Escolha outro horário.`;
          break;
        }

        // Space-Time Logistics: check transit time between tasks
        if (existingEnd <= startDateTime && t.location && location) {
          const timeGapMinutes = Math.floor((startDateTime.getTime() - existingEnd.getTime()) / 60000);

          try {
            const mapsRes = await fetch(
              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(t.location)}&destinations=${encodeURIComponent(location)}&key=${MAPS_API_KEY}&mode=walking`
            );
            const mapsData = await mapsRes.json();
            const transitSeconds = mapsData.rows?.[0]?.elements?.[0]?.duration?.value;
            
            if (transitSeconds) {
              const transitMinutes = Math.ceil(transitSeconds / 60);
              if (timeGapMinutes < transitMinutes) {
                hasConflict = true;
                conflictWarning = `Deslocamento impossível! "${t.title}" termina em ${t.location}, e o trânsito até ${location} leva ~${transitMinutes} min. Você só tem ${timeGapMinutes} min de intervalo.`;
                break;
              }
            }
          } catch (e) {
            console.error("[conflict-engine] Maps API error", e);
          }
        }
      }
    }

    // Burnout check
    const totalMinutesToday = (todaysTasks || []).reduce((acc: number, t: any) => acc + (t.estimated_duration_minutes || 0), 0);
    const hasBurnoutRisk = totalMinutesToday + estimatedMinutes > 10 * 60;
    
    if (!hasConflict && hasBurnoutRisk) {
      conflictWarning = `⚠️ Sua carga hoje passará de 10 horas (${Math.round((totalMinutesToday + estimatedMinutes) / 60)}h no total). Considere mover tarefas não urgentes.`;
    }

    console.log(`[conflict-engine] Result: conflict=${hasConflict}, estimated=${estimatedMinutes}min`);

    return new Response(
      JSON.stringify({
        estimated_minutes: estimatedMinutes,
        predicted_end_time: endDateTime.toISOString(),
        has_conflict: hasConflict,
        warning: conflictWarning,
        existing_tasks_count: todaysTasks?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err: any) {
    console.error("[conflict-engine] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
