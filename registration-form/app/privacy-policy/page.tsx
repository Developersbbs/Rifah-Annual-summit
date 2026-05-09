import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicy() {
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
            <Link href="/privacy-policy">Privacy Policy</Link>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-10">

          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

          <p className="mb-4 text-sm text-gray-500">
            Last updated: April 2026
          </p>

          <section className="space-y-6 text-[15px] leading-7">

            <div>
              <h2 className="font-semibold text-lg mb-2">
                1. Information We Collect
              </h2>
              <p>
                We collect personal information such as name, email address,
                phone number, and payment details when users register or make
                transactions on our platform.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                2. How We Use Information
              </h2>
              <p>
                The collected data is used to process payments, manage user
                accounts, and improve our services. Specifically for event registration,
                communication regarding the event, and payment processing.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                3. Data Protection
              </h2>
              <p>
                We implement appropriate security measures to protect user data
                from unauthorized access or disclosure. This includes encryption,
                secure servers, and access controls.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                4. Payments
              </h2>
              <p>
                All payments are processed securely via Razorpay. We do not store any
                credit/debit card details on our servers. Razorpay is PCI DSS compliant
                and follows industry-standard security practices.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                5. Third-Party Services
              </h2>
              <p>
                We use Razorpay as our payment processor. We do not share your personal
                data with third parties except as necessary for payment processing or
                when required by law.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                6. User Rights
              </h2>
              <p>
                You can request to update or delete your data by contacting us. We will
                respond to your request within a reasonable time frame.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                7. Contact Us
              </h2>
              <p>
                If you have any questions, contact us at:
                <br />
                Email: info@rifah.org
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
