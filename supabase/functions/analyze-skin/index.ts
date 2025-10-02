import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { imageUrl, scanId } = await req.json();
    console.log('Analyzing skin image for scan:', scanId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI for image analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a dermatology AI assistant. Analyze skin images and provide detailed assessment. Always include: condition description, risk level (low/moderate/high), and 3-5 specific recommendations. Format your response as JSON with keys: description, riskLevel, recommendations (array), disclaimer."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this skin image. Identify any visible conditions, assess risk level, and provide recommendations. Remember this is for educational purposes only."
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const analysisText = aiData.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log('AI Analysis complete:', analysis);

    // Update the scan with analysis results
    const { error: updateError } = await supabaseClient
      .from('skin_scans')
      .update({
        analysis_result: analysis,
        risk_level: analysis.riskLevel?.toLowerCase() || 'moderate',
        recommendations: analysis.recommendations || []
      })
      .eq('id', scanId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating scan:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-skin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
