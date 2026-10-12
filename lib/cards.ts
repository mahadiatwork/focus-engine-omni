import { Actions, Button, Card, CardText, type CardElement } from "chat";
import type { Reminder } from "./repository";
import { formatDateTime } from "./time";

export function reminderCard(reminder: Reminder): CardElement {
  const recurrence = reminder.recurrence === "once" ? "one-time" : `repeats ${reminder.recurrence}`;
  return Card({
    title: "Reminder set",
    children: [
      CardText(`**${reminder.title}**\n${formatDateTime(reminder.dueAt)} · ${recurrence}`),
      Actions([
        Button({ id: "reminder.done", value: reminder.id, label: "Done", style: "primary" }),
        Button({ id: "reminder.hour", value: reminder.id, label: "Remind in 1 hour" }),
        Button({ id: "reminder.tomorrow", value: reminder.id, label: "Remind tomorrow" }),
      ]),
    ],
  });
}

