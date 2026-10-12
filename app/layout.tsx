import type { ReactNode } from "react";

export const metadata = {
  title: "Mahadi Personal Agent",
  description: "A private WhatsApp-first personal assistant.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

