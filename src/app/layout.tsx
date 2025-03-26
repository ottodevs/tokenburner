import { Cinzel_Decorative, Montserrat } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "@/app/globals.css"
import { WagmiConfig } from "@/app/providers"
import { SoundProvider } from "@/components/sound-provider"
import { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"

// Font setup
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
})

const cinzel = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tokenburner.vercel.app'),
  title: "Inferno Token Burner",
  description: "Burn unwanted spam tokens from your wallet with style. Send those pesky spam tokens straight to hell!",
  openGraph: {
    title: "Inferno Token Burner",
    description: "Burn unwanted spam tokens from your wallet with style",
    images: [`/api/og`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inferno Token Burner",
    description: "Burn unwanted spam tokens from your wallet with style",
    images: [`/api/og`],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${montserrat.variable} ${cinzel.variable} antialiased bg-gray-950`}>
        <SoundProvider>
          <WagmiConfig>
            {children}
            <Toaster />
          </WagmiConfig>
        </SoundProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
