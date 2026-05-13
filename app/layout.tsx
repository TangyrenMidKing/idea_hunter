import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaRank – Group Idea Voting",
  description: "Add ideas, rank them, see what your group thinks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
