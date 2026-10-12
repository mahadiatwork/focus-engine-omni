import { getBot } from "@/lib/bot";
import { findDueReminders, markReminderDelivered } from "@/lib/repository";
import { formatDateTime } from "@/lib/time";

export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return !secret || request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.ENABLE_PROACTIVE_MESSAGES !== "true") {
    return Response.json({ ok: true, skipped: true, reason: "ENABLE_PROACTIVE_MESSAGES is not true" });
  }

  const due = await findDueReminders();
  const sent: string[] = [];
  for (const reminder of due) {
    const thread = getBot().thread(`whatsapp:${process.env.WHATSAPP_PHONE_NUMBER_ID}:${reminder.whatsappId}`);
    await thread.post(`⏰ Reminder: ${reminder.title}\nDue: ${formatDateTime(reminder.dueAt)}`);
    await markReminderDelivered(reminder);
    sent.push(reminder.id);
  }

  return Response.json({ ok: true, sent: sent.length });
}

