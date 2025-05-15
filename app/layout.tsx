import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Oswald } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GradeGenius - Your AI-Powered Assignment Grading",
  description: "Save hours weekly with GradeGenius, the AI assistant that grades essays, assignments, and code consistently and fairly. Trusted by thousands of educators nationwide.",
  icons: {
    icon: { url: '/favicon.png', type: 'image/png' },
    apple: { url: '/favicon.png', type: 'image/png' },
    shortcut: { url: '/favicon.png', type: 'image/png' }
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
