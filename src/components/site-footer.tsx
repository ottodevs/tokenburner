import Image from 'next/image'

export function SiteFooter() {
  return (
    <footer className="w-full py-12 px-6">
      <div className="max-w-7xl mx-auto flex justify-center">
        <div className="relative w-48 h-48 transform hover:scale-105 transition-transform duration-300">
          <Image
            src="/logo.png"
            alt="Token Burner Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </footer>
  )
} 