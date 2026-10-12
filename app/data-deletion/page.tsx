export const metadata = {
  title: "Data Deletion | Mahadi Personal Agent",
};

export default function DataDeletionPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32, fontFamily: "system-ui", lineHeight: 1.6 }}>
      <p><a href="/">← Mahadi Personal Agent</a></p>
      <h1>Data Deletion Instructions</h1>
      <p>Last updated: October 12, 2026</p>

      <p>To request deletion of information stored by Mahadi Personal Agent, email <a href="mailto:mahadi.hanshan@gmail.com?subject=Mahadi%20Personal%20Agent%20data%20deletion">mahadi.hanshan@gmail.com</a> from the account owner.</p>

      <p>Include the WhatsApp phone number associated with the account and write <strong>Data deletion request</strong> in the subject. Do not include passwords, access tokens, or other secrets.</p>

      <p>After verifying the request, the stored WhatsApp profile, reminders, todos, and study logs associated with that account will be deleted. Some records may remain temporarily in provider backups according to the provider&apos;s retention policies.</p>
    </main>
  );
}
