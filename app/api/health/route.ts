export const runtime = "nodejs";

export function GET() {
  return Response.json({
    ok: true,
    service: "mahadi-personal-agent",
    configured: {
      whatsapp: Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN &&
          process.env.WHATSAPP_APP_SECRET &&
          process.env.WHATSAPP_PHONE_NUMBER_ID &&
          process.env.WHATSAPP_VERIFY_TOKEN,
      ),
      firebase: Boolean(
        process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY,
      ),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      owner: Boolean(process.env.OWNER_WHATSAPP_ID),
      proactiveMessages: process.env.ENABLE_PROACTIVE_MESSAGES === "true",
    },
  });
}

