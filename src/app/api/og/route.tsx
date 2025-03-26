import { ImageResponse } from '@vercel/og'
import Image from 'next/image'

export const runtime = 'edge'

export async function GET() {
  try {
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
            backgroundColor: '#030711',
            backgroundImage: 'radial-gradient(circle at center, #7c2d12 0%, transparent 70%)',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              alt="Token Burner Logo"
              width="120"
              height="120"
            />
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              fontStyle: 'normal',
              color: '#f97316',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            Inferno Token Burner
          </div>

          {/* Description */}
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontStyle: 'normal',
              color: '#fdba74',
              textAlign: 'center',
              marginTop: '10px',
              maxWidth: '800px',
            }}
          >
            Burn unwanted spam tokens from your wallet with style
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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