import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MAPS_API_KEY = Deno.env.get("MAPS_API_KEY") || "AIzaSyBHczMP9iz8ZbjW7dVGdSAW9qdDKge1da4";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyDozLYYJ_l92V9m2EBRc9rJ6yd9UR8o6Fs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    const { title, proposed_start_time, location, user_id, category } = await req.json();

    if (!title || !proposed_start_time || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. GET ESTIMATED DURATION VIA GEMINI
    let estimatedMinutes = 30; // Default fallback
    try {
      const geminiPrompt = `Analyze the task: "${title}" (category: ${category}). Returning ONLY a JSON object like {"minutes": 45}. Give a realistic duration estimate in minutes. Do not explain.`;
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
      const parsed = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed.minutes) estimatedMinutes = parsed.minutes;
    } catch (e) {
      console.warn("Gemini prediction failed, using default 30 mins", e);
    }

    const startDateTime = new Date(proposed_start_time);
    const endDateTime = new Date(startDateTime.getTime() + estimatedMinutes * 60000);

    // 2. FETCH TODAYS TASKS FOR CONFLICT CHECK
    const startOfDay = new Date(startDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: todaysTasks, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .order("start_time", { ascending: true });

    if (error) throw error;

    let hasConflict = false;
    let conflictWarning = null;

    if (todaysTasks && todaysTasks.length > 0) {
      for (const t of todaysTasks) {
        if (!t.start_time || !t.end_time) continue;
        const previousEnd = new Date(t.end_time);
        
        // Simple Time Clash
        if (startDateTime < previousEnd && endDateTime > new Date(t.start_time)) {
          hasConflict = true;
          conflictWarning = `Conflito direto com a tarefa "${t.title}".`;
          break;
        }

        // Space-Time Logistics Clash (If previous task precedes this one directly)
        if (previousEnd <= startDateTime && t.location && location) {
          const timeGapMillis = startDateTime.getTime() - previousEnd.getTime();
          const timeGapMinutes = Math.floor(timeGapMillis / 60000);

          try {
            // Call Google Maps API Distance Matrix
            const mapsRes = await fetch(
              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(t.location)}&destinations=${encodeURIComponent(location)}&key=${MAPS_API_KEY}&mode=walking`
            );
            const mapsData = await mapsRes.json();
            const transitSeconds = mapsData.rows?.[0]?.elements?.[0]?.duration?.value;
            
            if (transitSeconds) {
              const transitMinutes = Math.ceil(transitSeconds / 60);
              if (timeGapMinutes < transitMinutes) {
                hasConflict = true;
                conflictWarning = `Deslocamento impossível. A tarefa anterior termina em ${t.location}, e o trânsito levará ${transitMinutes} min. Você terá apenas ${timeGapMinutes} min de intervalo.`;
                break;
              }
            }
          } catch (e) {
            console.error("Maps API error", e);
          }
        }
      }
    }

    const totalMinutesToday = (todaysTasks || []).reduce((acc, t) => acc + (t.estimated_duration_minutes || 0), 0);
    const hasBurnoutRisk = totalMinutesToday + estimatedMinutes > 10 * 60; // > 10 hours of tasks
    
    if (!hasConflict && hasBurnoutRisk) {
        conflictWarning = `Atenção: Sua carga horária hoje passará de 10 horas. Considere mover tarefas não urgentes para evitar burnout.`;
    }

    return new Response(
      JSON.stringify({
        estimated_minutes: estimatedMinutes,
        predicted_end_time: endDateTime.toISOString(),
        has_conflict: hasConflict,
        warning: conflictWarning
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
