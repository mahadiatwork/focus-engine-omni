import { FieldValue, Timestamp, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";

export type Reminder = {
  id: string;
  whatsappId: string;
  title: string;
  dueAt: string;
  recurrence: "once" | "daily" | "yearly";
  status: "active" | "completed" | "cancelled";
};

export type Todo = {
  id: string;
  title: string;
  status: "open" | "completed" | "cancelled";
  createdAt: string;
};

export type StudySummary = {
  totalMinutes: number;
  totalVideos: number;
  udemyVideos: number;
  fdeMinutes: number;
  researchMinutes: number;
};

type ReminderData = {
  title: string;
  dueAt: Timestamp;
  recurrence: Reminder["recurrence"];
  status: Reminder["status"];
};

function userRef(whatsappId: string) {
  return getDb().collection("users").doc(whatsappId);
}

function reminderFromSnapshot(whatsappId: string, snapshot: QueryDocumentSnapshot | DocumentSnapshot) {
  const data = snapshot.data() as ReminderData | undefined;
  if (!data) return null;
  return {
    id: snapshot.id,
    whatsappId,
    title: data.title,
    dueAt: data.dueAt.toDate().toISOString(),
    recurrence: data.recurrence,
    status: data.status,
  } satisfies Reminder;
}

export async function ensureUser(whatsappId: string, timezone = "Asia/Shanghai") {
  await userRef(whatsappId).set(
    { timezone, language: "en", updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function createReminder(input: {
  whatsappId: string;
  title: string;
  dueAt: Date;
  recurrence?: Reminder["recurrence"];
}): Promise<Reminder> {
  await ensureUser(input.whatsappId);
  const reference = userRef(input.whatsappId).collection("reminders").doc();
  await reference.set({
    title: input.title,
    dueAt: Timestamp.fromDate(input.dueAt),
    recurrence: input.recurrence ?? "once",
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
  });
  return {
    id: reference.id,
    whatsappId: input.whatsappId,
    title: input.title,
    dueAt: input.dueAt.toISOString(),
    recurrence: input.recurrence ?? "once",
    status: "active",
  };
}

export async function listActiveReminders(whatsappId: string): Promise<Reminder[]> {
  const snapshot = await userRef(whatsappId)
    .collection("reminders")
    .where("status", "==", "active")
    .orderBy("dueAt", "asc")
    .limit(50)
    .get();
  return snapshot.docs.flatMap((item) => {
    const reminder = reminderFromSnapshot(whatsappId, item);
    return reminder ? [reminder] : [];
  });
}

export async function findReminder(whatsappId: string, idOrTitle: string): Promise<Reminder | null> {
  const reference = userRef(whatsappId).collection("reminders").doc(idOrTitle);
  const byId = await reference.get();
  if (byId.exists && byId.data()?.status === "active") return reminderFromSnapshot(whatsappId, byId);
  const reminders = await listActiveReminders(whatsappId);
  return reminders.find((item) => item.title.toLowerCase() === idOrTitle.trim().toLowerCase()) ?? null;
}

export async function completeReminder(whatsappId: string, id: string) {
  const reference = userRef(whatsappId).collection("reminders").doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.status !== "active") return false;
  await reference.update({ status: "completed", completedAt: FieldValue.serverTimestamp() });
  return true;
}

export async function snoozeReminder(whatsappId: string, id: string, dueAt: Date) {
  const reference = userRef(whatsappId).collection("reminders").doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.status !== "active") return false;
  await reference.update({ dueAt: Timestamp.fromDate(dueAt), lastNotifiedAt: FieldValue.delete() });
  return true;
}

export async function cancelReminder(whatsappId: string, id: string) {
  const reference = userRef(whatsappId).collection("reminders").doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.status !== "active") return false;
  await reference.update({ status: "cancelled" });
  return true;
}

export async function createTodo(whatsappId: string, title: string) {
  await ensureUser(whatsappId);
  const reference = userRef(whatsappId).collection("todos").doc();
  await reference.set({ title, status: "open", createdAt: FieldValue.serverTimestamp() });
  return reference.id;
}

export async function listOpenTodos(whatsappId: string): Promise<Todo[]> {
  const snapshot = await userRef(whatsappId)
    .collection("todos")
    .where("status", "==", "open")
    .orderBy("createdAt", "asc")
    .limit(50)
    .get();
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      title: data.title,
      status: data.status,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    } satisfies Todo;
  });
}

export async function completeTodo(whatsappId: string, id: string) {
  const reference = userRef(whatsappId).collection("todos").doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.status !== "open") return false;
  await reference.update({ status: "completed", completedAt: FieldValue.serverTimestamp() });
  return true;
}

export async function logStudy(input: {
  whatsappId: string;
  track: "udemy" | "fde" | "research" | "other";
  videos?: number;
  minutes?: number;
  note?: string;
  studyDate: string;
}) {
  await ensureUser(input.whatsappId);
  await userRef(input.whatsappId).collection("study_logs").add({
    studyDate: input.studyDate,
    track: input.track,
    videos: input.videos ?? 0,
    minutes: input.minutes ?? 0,
    note: input.note ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getStudySummary(whatsappId: string): Promise<StudySummary> {
  const snapshot = await userRef(whatsappId).collection("study_logs").get();
  return snapshot.docs.reduce<StudySummary>(
    (summary, item) => {
      const data = item.data();
      const minutes = Number(data.minutes ?? 0);
      const videos = Number(data.videos ?? 0);
      summary.totalMinutes += minutes;
      summary.totalVideos += videos;
      if (data.track === "udemy") summary.udemyVideos += videos;
      if (data.track === "fde") summary.fdeMinutes += minutes;
      if (data.track === "research") summary.researchMinutes += minutes;
      return summary;
    },
    { totalMinutes: 0, totalVideos: 0, udemyVideos: 0, fdeMinutes: 0, researchMinutes: 0 },
  );
}

export async function findDueReminders(): Promise<Reminder[]> {
  const snapshot = await getDb()
    .collectionGroup("reminders")
    .where("status", "==", "active")
    .where("dueAt", "<=", Timestamp.now())
    .orderBy("dueAt", "asc")
    .limit(100)
    .get();
  return snapshot.docs.flatMap((item) => {
    const whatsappId = item.ref.parent.parent?.id;
    if (!whatsappId) return [];
    const reminder = reminderFromSnapshot(whatsappId, item);
    return reminder ? [reminder] : [];
  });
}

export async function markReminderDelivered(reminder: Reminder) {
  const reference = userRef(reminder.whatsappId).collection("reminders").doc(reminder.id);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.status !== "active") return;

  if (reminder.recurrence === "once") {
    await reference.update({ lastNotifiedAt: FieldValue.serverTimestamp() });
    return;
  }

  const nextDueAt = new Date(reminder.dueAt);
  if (reminder.recurrence === "daily") nextDueAt.setUTCDate(nextDueAt.getUTCDate() + 1);
  if (reminder.recurrence === "yearly") nextDueAt.setUTCFullYear(nextDueAt.getUTCFullYear() + 1);
  await reference.update({ dueAt: Timestamp.fromDate(nextDueAt), lastNotifiedAt: FieldValue.serverTimestamp() });
}

