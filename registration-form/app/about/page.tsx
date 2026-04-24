import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">

      {/* HEADER */}
      <header className="w-full border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/assets/logo.svg" alt="Rifah" width={32} height={32} className="h-8 w-auto" />
            <span className="font-semibold text-lg">Rifah</span>
          </div>

          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-10">

          <h1 className="text-3xl font-bold mb-6">About RIFAH</h1>

          <p className="mb-4 text-sm text-gray-500">
            RIFAH Chamber of Commerce and Industry
          </p>

          <section className="space-y-6 text-[15px] leading-7">

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Who We Are
              </h2>
              <p>
                RIFAH Chamber of Commerce is a not-for-profit business network focused on empowering entrepreneurs through collaboration, mentorship, and ethical growth. With a strong foundation in responsible entrepreneurship, RIFAH supports businesses through consulting, startup guidance, financial advisory, and international expansion support.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Our Mission
              </h2>
              <p>
                To build an ethical business ecosystem that empowers entrepreneurs, fosters collaboration, and drives sustainable growth across communities and industries in India.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                What We Do
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Business consulting and advisory services</li>
                <li>Startup guidance and mentorship programs</li>
                <li>Financial advisory and support</li>
                <li>International business expansion assistance</li>
                <li>Networking events and conferences</li>
                <li>Entrepreneurship development programs</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                RIFAH Annual Summit
              </h2>
              <p>
                The RIFAH Annual Summit is our flagship event that brings together entrepreneurs, business leaders, and industry experts from across India. It&apos;s a platform for networking, learning, and exploring new business opportunities. The summit features keynote speakers, panel discussions, workshops, and ample networking opportunities.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Our Values
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Ethics First:</strong> We believe in doing business the right way</li>
                <li><strong>Collaboration:</strong> Together we achieve more</li>
                <li><strong>Empowerment:</strong> Enabling entrepreneurs to succeed</li>
                <li><strong>Integrity:</strong> Honest and transparent in all dealings</li>
                <li><strong>Innovation:</strong> Embracing new ideas and approaches</li>
              </ul>
            </div>

          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">

          <p>© 2026 Rifah. All Rights Reserved & Developed by SBBS.</p>

          <div className="flex gap-4 mt-3 md:mt-0">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>

        </div>
      </footer>

    </div>
  );
}
