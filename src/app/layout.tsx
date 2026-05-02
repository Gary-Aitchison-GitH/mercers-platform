import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageContext'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mercers Kensington | Property Agents in Zimbabwe — Harare & Marondera',
  description: "Mercers Kensington — Zimbabwe's trusted estate agents. Commercial, industrial, agricultural and residential properties for sale and rent across Zimbabwe.",
  keywords: ['property Zimbabwe', 'estate agents Harare', 'estate agents Marondera', 'farm for sale Zimbabwe', 'commercial property Zimbabwe', 'Mercers Kensington'],
  openGraph: {
    title: 'Mercers Kensington | Property Agents in Zimbabwe',
    description: "Zimbabwe's trusted estate agents — Harare & Marondera",
    type: 'website',
    locale: 'en_ZW',
  },
  alternates: {
    languages: {
      'en': '/',
      'sn': '/?lang=sn',
      'nd': '/?lang=nd',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'RealEstateAgent',
              name: 'Mercers Kensington',
              description: "Zimbabwe's trusted estate agents",
              address: {
                '@type': 'PostalAddress',
                streetAddress: '19 Kay Gardens, Kensington',
                addressLocality: 'Harare',
                addressCountry: 'ZW',
              },
              areaServed: ['Harare', 'Marondera', 'Zimbabwe'],
              memberOf: {
                '@type': 'Organization',
                name: 'Estate Agents Council of Zimbabwe',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
