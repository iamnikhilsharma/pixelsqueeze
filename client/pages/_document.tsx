import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Meta tags */}
        <meta name="description" content="PixelSqueeze - Professional image optimization made simple. Compress and optimize your images with advanced algorithms while maintaining quality." />
        <meta name="keywords" content="image optimization, image compression, webp, jpeg, png, image processing, file size reduction" />
        <meta name="author" content="PixelSqueeze" />
        
        {/* Open Graph */}
        <meta property="og:title" content="PixelSqueeze - Image Optimization Made Simple" />
        <meta property="og:description" content="Professional image optimization made simple. Compress and optimize your images with advanced algorithms while maintaining quality." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixelsqueeze.com" />
        <meta property="og:image" content="/logo.svg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PixelSqueeze - Image Optimization Made Simple" />
        <meta name="twitter:description" content="Professional image optimization made simple. Compress and optimize your images with advanced algorithms while maintaining quality." />
        <meta name="twitter:image" content="/logo.svg" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#6366F1" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 