import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PowerScale: Who wins?",
  description:
    "Vote on character matchups you actually know. Crowdsourced Elo rankings across anime, comics, and film.",
  openGraph: {
    title: "PowerScale",
    description: "Crowdsourced character ranking. Only vote on who you know.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('powerscale-theme');
                if (!theme) {
                  theme = 'default';
                  localStorage.setItem('powerscale-theme', theme);
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
