import "@/globals.css"

import { Inter } from "next/font/google"

import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Aztec Recognizer",
  description: "Recognize and celebrate Aztec community members",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={[inter.className, "bg-brand-gradient text-white"].join(" ")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
