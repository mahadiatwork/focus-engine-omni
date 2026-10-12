export const metadata = {
  title: "Terms of Service | Mahadi Personal Agent",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32, fontFamily: "system-ui", lineHeight: 1.6 }}>
      <p><a href="/">← Mahadi Personal Agent</a></p>
      <h1>Terms of Service</h1>
      <p>Last updated: October 12, 2026</p>

      <h2>Personal-use service</h2>
      <p>Mahadi Personal Agent is a private personal assistant operated for reminders, todos, study tracking, and related productivity tasks.</p>

      <h2>Acceptable use</h2>
      <p>You may use the service only for lawful purposes. Do not use it to store highly sensitive information, send unwanted messages, bypass WhatsApp rules, or interfere with the service.</p>

      <h2>Accuracy and availability</h2>
      <p>AI-generated responses may be incomplete or incorrect. Reminders depend on WhatsApp delivery, provider availability, and configured schedules. The service is provided without a guarantee that every message will be delivered at an exact time.</p>

      <h2>Third-party services</h2>
      <p>The service depends on WhatsApp/Meta, Firebase, Vercel, and OpenRouter. Their terms, availability, and usage limits also apply.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:mahadi.hanshan@gmail.com">mahadi.hanshan@gmail.com</a>.</p>
    </main>
  );
}
