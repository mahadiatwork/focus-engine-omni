import { after } from "next/server";
import { getBot } from "@/lib/bot";

export const runtime = "nodejs";

function runInBackground(task: Promise<unknown>) {
  after(async () => {
    await task;
  });
}

export async function GET(request: Request) {
  return getBot().webhooks.whatsapp(request, { waitUntil: runInBackground });
}

export async function POST(request: Request) {
  return getBot().webhooks.whatsapp(request, { waitUntil: runInBackground });
}

