import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Gym Assistant",
  description: "7-module AI fitness ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full">{children}</body>
    </html>
  );
}