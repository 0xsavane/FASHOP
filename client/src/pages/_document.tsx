import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta name="application-name" content="FASHOP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FASHOP" />
        <meta name="description" content="Plateforme e-commerce de mode et accessoires en Guinée" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#f97316" />

        <link rel="manifest" href="/manifest.json" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://fashop.gn" />
        <meta name="twitter:title" content="FASHOP" />
        <meta name="twitter:description" content="Mode et accessoires en Guinée" />
        <meta name="twitter:image" content="/icons/icon-192x192.png" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FASHOP" />
        <meta property="og:description" content="Plateforme e-commerce de mode et accessoires en Guinée" />
        <meta property="og:site_name" content="FASHOP" />
        <meta property="og:url" content="https://fashop.gn" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
