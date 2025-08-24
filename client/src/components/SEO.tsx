import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
}

export default function SEO({
  title = 'FASHOP - E-commerce en Guinée',
  description = 'La première plateforme e-commerce de dropshipping local en Guinée. Des produits de qualité, livrés rapidement à Conakry et dans toute la Guinée.',
  keywords = 'e-commerce, Guinée, dropshipping, livraison, Conakry, produits, shopping, mode, électronique, maison',
  image = '/og-image.jpg',
  url = 'https://fashop.gn',
  type = 'website',
  noindex = false
}: SEOProps) {
  const fullTitle = title.includes('FASHOP') ? title : `${title} | FASHOP`
  const fullUrl = url.startsWith('http') ? url : `https://fashop.gn${url}`
  const fullImage = image.startsWith('http') ? image : `https://fashop.gn${image}`

  return (
    <Head>
      {/* Titre et description de base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Viewport et charset */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="FASHOP" />
      <meta property="og:locale" content="fr_GN" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Liens canoniques */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme color */}
      <meta name="theme-color" content="#2563eb" />
      
      {/* Données structurées pour les produits */}
      {type === 'product' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": title,
              "description": description,
              "image": fullImage,
              "brand": {
                "@type": "Brand",
                "name": "FASHOP"
              },
              "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "priceCurrency": "GNF"
              }
            })
          }}
        />
      )}
      
      {/* Données structurées pour l'organisation */}
      {type === 'website' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "FASHOP",
              "url": "https://fashop.gn",
              "logo": "https://fashop.gn/logo.png",
              "description": description,
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "GN",
                "addressLocality": "Conakry"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+224-610-06-73-80",
                "contactType": "customer service"
              }
            })
          }}
        />
      )}
    </Head>
  )
}
