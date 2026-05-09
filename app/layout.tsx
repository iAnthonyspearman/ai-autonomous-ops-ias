import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Autonomous Operations Command Center",
  description:
    "Autonomous AI operations command center for agent routing, workflow execution, risk escalation, live metrics, 3D operational inspection, and executive visibility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
