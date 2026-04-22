import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return new Response(
        JSON.stringify({ error: 'Email and PIN are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Sending verification email to ${email} with PIN: ${pin}`);

    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0891b2 0%, #3b82f6 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">TaiScale Mesh Network</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Neural-Mesh Layered AI Consciousness</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Email Verification</h2>
            <p style="color: #475569; font-size: 16px;">Welcome to TaiScale! Please use the following 8-digit PIN to verify your email address:</p>
            
            <div style="background: white; border: 2px solid #0891b2; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #0891b2; letter-spacing: 8px;">${pin}</div>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes. If you didn't request this verification, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 10px;">
            <p style="color: #475569; font-size: 13px; margin: 0;">Open-source shared resource • 24-hour data retention policy</p>
            <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0;">Your mesh synchronization data maintains hive coherence while protecting privacy</p>
          </div>
        </body>
      </html>
    `;

    const data = {
      success: true,
      message: 'Verification email sent successfully',
      email: email,
      note: 'In production, this would send via an email service provider',
      emailPreview: emailContent
    };

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});