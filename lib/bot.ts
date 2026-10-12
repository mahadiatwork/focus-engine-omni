import { createMemoryState } from "@chat-adapter/state-memory";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { Chat } from "chat";
import { handleCommand, snoozeFromAction } from "./commands";
import { completeReminder } from "./repository";

let bot: Chat | undefined;

function whatsappUserId(threadId: string) {
  return threadId.split(":").at(-1) ?? "";
}

function isOwner(threadId: string) {
  const configuredOwner = process.env.OWNER_WHATSAPP_ID?.trim();
  return Boolean(configuredOwner && configuredOwner === whatsappUserId(threadId));
}

async function rejectIfNeeded(thread: { id: string; post(message: string): Promise<unknown> }) {
  if (isOwner(thread.id)) return true;
  if (!process.env.OWNER_WHATSAPP_ID) {
    await thread.post("This bot is not configured yet. Add OWNER_WHATSAPP_ID before using it.");
  }
  return false;
}

function registerHandlers(instance: Chat) {
  instance.onDirectMessage(async (thread, message) => {
    if (!(await rejectIfNeeded(thread))) return;

    try {
      await thread.markAsRead(message);
    } catch {
      // A read receipt is helpful but should never prevent the reply.
    }

    try {
      await thread.startTyping();
    } catch {
      // Typing indicators are optional on WhatsApp.
    }

    try {
      const reply = await handleCommand(whatsappUserId(thread.id), message.text);
      if (reply.card) {
        await thread.post(reply.card);
      } else {
        await thread.post(reply.text ?? "I don't have a response for that yet.");
      }
    } catch (error) {
      console.error("WhatsApp message handling failed", error);
      await thread.post("I couldn't complete that safely. Please try again, or send 'help'.");
    }
  });

  instance.onAction(["reminder.done", "reminder.hour", "reminder.tomorrow"], async (event) => {
    if (!event.thread || !isOwner(event.thread.id) || !event.value) return;
    const whatsappId = whatsappUserId(event.thread.id);

    try {
      if (event.actionId === "reminder.done") {
        const changed = await completeReminder(whatsappId, event.value);
        await event.thread.post(changed ? "Done — reminder completed. ✅" : "That reminder is no longer active.");
        return;
      }

      const amount = event.actionId === "reminder.hour" ? 60 * 60_000 : 24 * 60 * 60_000;
      await event.thread.post(await snoozeFromAction(whatsappId, event.value, amount));
    } catch (error) {
      console.error("WhatsApp action handling failed", error);
      await event.thread.post("I couldn't update that reminder. Please send 'reminders' and try again.");
    }
  });
}

export function getBot() {
  if (bot) return bot;

  const instance = new Chat({
    userName: process.env.WHATSAPP_BOT_USERNAME || "mahadi-agent",
    adapters: { whatsapp: createWhatsAppAdapter() },
    // This private bot uses direct-message routing; durable personal data lives in Firestore.
    state: createMemoryState(),
  });
  registerHandlers(instance);
  bot = instance;
  return instance;
}

export { whatsappUserId };

