export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32, fontFamily: "system-ui" }}>
      <h1>Mahadi Personal Agent</h1>
      <p>WhatsApp-first reminders, todos, and study tracking.</p>
      <p>Webhook endpoint: <code>/api/webhooks/whatsapp</code></p>
      <p>Health endpoint: <code>/api/health</code></p>
      <footer style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/data-deletion">Data Deletion</a>
      </footer>
    </main>
  );
}

