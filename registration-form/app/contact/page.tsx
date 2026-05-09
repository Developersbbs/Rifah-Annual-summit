import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
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
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-10">

          <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

          <p className="mb-4 text-sm text-gray-500">
            Get in touch with RIFAH Chamber of Commerce
          </p>

          <section className="space-y-6 text-[15px] leading-7">

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Office Address
              </h2>
              <p>
                KAY EM SPECTRA<br />
                Vanagaram, Near Maduravoyal Bridge<br />
                Chennai, India
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Email
              </h2>
              <p>
                <a href="mailto:info@rafah.co.in" className="text-blue-600 hover:underline">
                  info@rifah.org
                </a>
                <br />
                {/* <a href="mailto:support@rifah.org" className="text-blue-600 hover:underline">
                  support@rifah.org
                </a> */}
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Phone
              </h2>
              <p>
                <a href="tel:9840412484" className="text-blue-600 hover:underline">
                  +91 9840412484
                </a>
              </p>
            </div>

            {/* <div>
              <h2 className="font-semibold text-lg mb-2">
                Business Hours
              </h2>
              <p>
                Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                Saturday: 10:00 AM - 2:00 PM IST<br />
                Sunday: Closed
              </p>
            </div> */}

            <div>
              <h2 className="font-semibold text-lg mb-2">
                For Event Queries
              </h2>
              <p>
                For specific questions about the RIFAH Annual Summit 2026, including registration,
                sponsorship opportunities, or partnership inquiries, please email us at
                <a href="mailto:support@rifah.org" className="text-blue-600 hover:underline ml-1">
                  info@rifah.org
                </a>
              </p>
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
