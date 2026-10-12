export const metadata = {
  title: "Privacy Policy | Mahadi Personal Agent",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32, fontFamily: "system-ui", lineHeight: 1.6 }}>
      <p><a href="/">← Mahadi Personal Agent</a></p>
      <h1>Privacy Policy</h1>
      <p>Last updated: October 12, 2026</p>

      <h2>What this service does</h2>
      <p>Mahadi Personal Agent is a private WhatsApp assistant for managing reminders, todos, and personal study progress.</p>

      <h2>Information we process</h2>
      <ul>
        <li>Your WhatsApp identifier and messages sent to the assistant.</li>
        <li>Reminders, todos, study logs, and preferences that you ask the assistant to save.</li>
        <li>Technical information needed to deliver WhatsApp messages and protect the service.</li>
      </ul>

      <h2>How information is used</h2>
      <p>Information is used to understand your commands, save your personal records, answer questions, and send requested reminders. State-changing commands are processed by the application. Non-command messages may be sent to OpenRouter to generate a conversational response.</p>

      <h2>Service providers</h2>
      <p>WhatsApp/Meta delivers messages, Firebase Cloud Firestore stores the assistant&apos;s records, Vercel hosts the application, and OpenRouter may process conversational prompts. These providers process information only as needed to provide their services.</p>

      <h2>Sharing and retention</h2>
      <p>We do not sell your personal information. Records are retained until they are deleted by the owner or a deletion request is completed. This is a personal project and is not intended for sensitive medical, financial, or confidential business information.</p>

      <h2>Contact</h2>
      <p>For privacy questions or deletion requests, contact <a href="mailto:mahadi.hanshan@gmail.com">mahadi.hanshan@gmail.com</a>.</p>
    </main>
  );
}
