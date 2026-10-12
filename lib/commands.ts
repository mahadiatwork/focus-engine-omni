import type { CardElement } from "chat";
import { reminderCard } from "./cards";
import {
  cancelReminder,
  completeReminder,
  completeTodo,
  createReminder,
  createTodo,
  findReminder,
  getStudySummary,
  listActiveReminders,
  listOpenTodos,
  logStudy,
  snoozeReminder,
} from "./repository";
import { answerWithOpenRouter } from "./openrouter";
import { formatDateTime, localDateKey, parseReminderRequest } from "./time";

export type BotReply = { text?: string; card?: CardElement };

function helpText() {
  return [
    "I can help with reminders, todos, and study tracking.",
    "",
    "Try:",
    "• remind me in 10 minutes to call Eric",
    "• remind me tomorrow at 9 am to pay Eric",
    "• daily check-in at 10 pm",
    "• reminders",
    "• todo review the paper",
    "• todos",
    "• complete reminder 1",
    "• study udemy 2 videos 45 minutes",
    "• status",
  ].join("\n");
}

function parseIndex(value: string) {
  const match = value.trim().match(/^(?:reminder|todo)?\s*#?(\d+)$/i);
  return match ? Number(match[1]) - 1 : null;
}

function renderReminders(reminders: Awaited<ReturnType<typeof listActiveReminders>>) {
  if (reminders.length === 0) return "You have no active reminders.";
  return [
    "Active reminders:",
    ...reminders.map((reminder, index) => `${index + 1}. ${reminder.title} — ${formatDateTime(reminder.dueAt)}${reminder.recurrence === "once" ? "" : ` · ${reminder.recurrence}`}`),
    "",
    "Reply 'complete reminder 1', or ask me to reschedule one.",
  ].join("\n");
}

function renderTodos(todos: Awaited<ReturnType<typeof listOpenTodos>>) {
  if (todos.length === 0) return "You have no open todos.";
  return ["Open todos:", ...todos.map((todo, index) => `${index + 1}. ${todo.title}`), "", "Reply 'complete todo 1' when one is finished."].join("\n");
}

function parseStudyLog(text: string) {
  const match = text.match(/^(?:stud(?:y|ied)|log study)\s+(udemy|fde|research|other)(?:\s+(\d+)\s+videos?)?(?:\s+(\d+)\s*(?:minutes?|mins?))?(?:\s+(.+))?$/i);
  if (!match) return null;
  return {
    track: match[1].toLowerCase() as "udemy" | "fde" | "research" | "other",
    videos: Number(match[2] ?? 0),
    minutes: Number(match[3] ?? 0),
    note: match[4]?.trim(),
  };
}

async function completeByReference(whatsappId: string, kind: "reminder" | "todo", reference: string) {
  if (kind === "reminder") {
    const reminders = await listActiveReminders(whatsappId);
    const index = parseIndex(reference);
    const reminder = index !== null ? reminders[index] : await findReminder(whatsappId, reference.trim());
    if (!reminder) return "I couldn't find that active reminder. Reply 'reminders' to see the current list.";
    const changed = await completeReminder(whatsappId, reminder.id);
    return changed ? `Done — I marked “${reminder.title}” complete. ✅` : "That reminder changed before I could complete it. Please refresh with 'reminders'.";
  }

  const todos = await listOpenTodos(whatsappId);
  const index = parseIndex(reference);
  const todo = index !== null ? todos[index] : todos.find((item) => item.title.toLowerCase() === reference.trim().toLowerCase());
  if (!todo) return "I couldn't find that open todo. Reply 'todos' to see the current list.";
  const changed = await completeTodo(whatsappId, todo.id);
  return changed ? `Done — I marked “${todo.title}” complete. ✅` : "That todo changed before I could complete it. Please refresh with 'todos'.";
}

async function buildStateContext(whatsappId: string) {
  const [reminders, todos, study] = await Promise.all([listActiveReminders(whatsappId), listOpenTodos(whatsappId), getStudySummary(whatsappId)]);
  return JSON.stringify({
    activeReminders: reminders.map((item) => ({ title: item.title, dueAt: item.dueAt, recurrence: item.recurrence })),
    openTodos: todos.map((item) => item.title),
    studyTotals: study,
  });
}

export async function handleCommand(whatsappId: string, rawText: string): Promise<BotReply> {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  if (!text || lower === "help" || lower === "menu" || lower === "start") return { text: helpText() };

  if (/^(?:reminders?|what reminders do i have|list reminders)$/i.test(text)) {
    return { text: renderReminders(await listActiveReminders(whatsappId)) };
  }

  if (/^(?:todos?|tasks?)$/i.test(text)) {
    return { text: renderTodos(await listOpenTodos(whatsappId)) };
  }

  const study = parseStudyLog(text);
  if (study) {
    await logStudy({ whatsappId, ...study, studyDate: localDateKey() });
    return { text: `Logged ${study.track.toUpperCase()}: ${study.videos} video(s), ${study.minutes} minute(s). Keep the record honest and small. 📚` };
  }

  if (/^status$/i.test(text)) {
    const [reminders, todos, summary] = await Promise.all([listActiveReminders(whatsappId), listOpenTodos(whatsappId), getStudySummary(whatsappId)]);
    return {
      text: [
        "Your current snapshot:",
        `• ${reminders.length} active reminder(s)`,
        `• ${todos.length} open todo(s)`,
        `• ${summary.totalVideos} Udemy/FDE study video(s) logged`,
        `• ${summary.totalMinutes} study minute(s) logged`,
      ].join("\n"),
    };
  }

  const completion = text.match(/^complete\s+(reminder|todo)\s+(.+)$/i) ?? text.match(/^done\s+(reminder|todo)\s+(.+)$/i);
  if (completion) return { text: await completeByReference(whatsappId, completion[1].toLowerCase() as "reminder" | "todo", completion[2]) };

  const cancel = text.match(/^cancel\s+reminder\s+(.+)$/i);
  if (cancel) {
    const reminders = await listActiveReminders(whatsappId);
    const index = parseIndex(cancel[1]);
    const reminder = index !== null ? reminders[index] : await findReminder(whatsappId, cancel[1].trim());
    if (!reminder) return { text: "I couldn't find that active reminder. Reply 'reminders' to see the current list." };
    return { text: (await cancelReminder(whatsappId, reminder.id)) ? `Cancelled “${reminder.title}”.` : "That reminder changed before I could cancel it." };
  }

  const todo = text.match(/^(?:todo|task|add todo)\s+(.+)$/i);
  if (todo) {
    const title = todo[1].trim();
    await createTodo(whatsappId, title);
    return { text: `Added to your todo list: “${title}”.` };
  }

  const reminder = parseReminderRequest(text);
  if (reminder) {
    const created = await createReminder({ whatsappId, ...reminder });
    return { card: reminderCard(created) };
  }

  const context = await buildStateContext(whatsappId);
  return { text: (await answerWithOpenRouter({ message: text, context })) ?? "I can manage reminders, todos, and study logs. Try 'help' to see examples." };
}

export async function snoozeFromAction(whatsappId: string, id: string, amountMs: number) {
  const reminder = (await listActiveReminders(whatsappId)).find((item) => item.id === id);
  if (!reminder) return "That reminder is no longer active.";
  const dueAt = new Date(Date.now() + amountMs);
  const changed = await snoozeReminder(whatsappId, id, dueAt);
  return changed ? `Okay — I moved “${reminder.title}” to ${formatDateTime(dueAt)}.` : "That reminder changed before I could move it.";
}

