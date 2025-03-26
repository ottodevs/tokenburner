import { ImageResponse } from '@vercel/og'

// Route segment config
export const runtime = 'edge'

// Font files
const cinzelRegular = fetch(
  new URL('@fontsource/cinzel-decorative/files/cinzel-decorative-latin-400-normal.woff', import.meta.url)
).then((res) => res.arrayBuffer())

const cinzelBold = fetch(
  new URL('@fontsource/cinzel-decorative/files/cinzel-decorative-latin-700-normal.woff', import.meta.url)
).then((res) => res.arrayBuffer())

export async function GET() {
  try {
    const [cinzelRegularData, cinzelBoldData] = await Promise.all([
      cinzelRegular,
      cinzelBold,
    ])

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#030711', // bg-gray-950
            backgroundImage: 'radial-gradient(circle at center, #7c2d12 0%, #030711 70%)', // Matching your app's gradient
            fontFamily: 'Cinzel Decorative',
            // position: 'relative',
            // overflow: 'hidden',
          }}
        >
          {/* Background Effects - Similar to your app's styling */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(3,7,17,0.8), rgba(127,29,29,0.4), rgba(3,7,17,0.8))',
            }}
          />

          {/* Animated Flames at the bottom */}
          <div style={{ display: 'flex', position: 'absolute', bottom: '-20px', width: '100%', height: '180px' }}>
            {/* Central Large Flame */}
            <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="flameGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 0.8 }} />
                  <stop offset="50%" style={{ stopColor: '#ea580c', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#7c2d12', stopOpacity: 0.4 }} />
                </linearGradient>
                <linearGradient id="flameGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.9 }} />
                  <stop offset="60%" style={{ stopColor: '#f97316', stopOpacity: 0.7 }} />
                  <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 0.5 }} />
                </linearGradient>
                <filter id="flameBlur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>
              </defs>
              
              {/* Base flames layer */}
              <path
                d="M100,0 C120,50 150,80 150,120 C150,180 50,180 50,120 C50,80 80,50 100,0"
                fill="url(#flameGradient1)"
                filter="url(#flameBlur)"
                style={{ transform: 'scale(1.2)' }}
              />
              
              {/* Inner flames layer */}
              <path
                d="M100,20 C115,60 135,85 135,115 C135,165 65,165 65,115 C65,85 85,60 100,20"
                fill="url(#flameGradient2)"
                filter="url(#flameBlur)"
                style={{ transform: 'scale(1.1)' }}
              />
            </svg>

            {/* Left Smaller Flame */}
            <svg width="150" height="150" viewBox="0 0 200 200" style={{ position: 'absolute', bottom: 0, left: '15%' }}>
              <path
                d="M100,20 C115,60 135,85 135,115 C135,165 65,165 65,115 C65,85 85,60 100,20"
                fill="url(#flameGradient2)"
                filter="url(#flameBlur)"
                style={{ transform: 'scale(0.8)' }}
              />
            </svg>

            {/* Right Smaller Flame */}
            <svg width="150" height="150" viewBox="0 0 200 200" style={{ position: 'absolute', bottom: 0, right: '15%' }}>
              <path
                d="M100,20 C115,60 135,85 135,115 C135,165 65,165 65,115 C65,85 85,60 100,20"
                fill="url(#flameGradient1)"
                filter="url(#flameBlur)"
                style={{ transform: 'scale(0.9)' }}
              />
            </svg>
          </div>

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              gap: '10px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
                width: '160px',
                height: '160px',
                position: 'relative',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
                alt="Token Burner Logo"
                width="400"
                height="400"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.4))', // orange-500 glow
                }}
              />
            </div>

            {/* Title */}
            <div
              style={{
                display: 'flex',
                fontSize: 75,
                fontWeight: 700,
                color: '#f97316', // text-orange-500
                marginBottom: '24px',
                textAlign: 'center',
                textShadow: '0 0 20px rgba(249, 115, 22, 0.4)', // Matching the glow effect
                letterSpacing: '-0.02em',
              }}
            >
              Inferno Token Burner
            </div>

            {/* Description */}
            <div
              style={{
                display: 'flex',
                fontSize: 40,
                fontWeight: 500,
                color: '#fdba74', // text-orange-200
                textAlign: 'center',
                marginTop: '16px',
                maxWidth: '800px',
                lineHeight: 1.4,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Burn unwanted spam tokens from your wallet with style
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Cinzel Decorative',
            data: cinzelRegularData,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Cinzel Decorative',
            data: cinzelBoldData,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(`${error.message}`)
    } else {
      console.log(`Unknown error: ${error}`)
    }
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
} 