import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
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
            <Link href="/terms">Terms & Conditions</Link>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-10">

          <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>

          <p className="mb-4 text-sm text-gray-500">
            Last updated: April 2026
          </p>

          <section className="space-y-6 text-[15px] leading-7">

            <div>
              <h2 className="font-semibold text-lg mb-2">
                1. Introduction
              </h2>
              <p>
                By registering for Rifah Annual Summit 2026, you agree to comply with all the terms and conditions mentioned below. This agreement is legally binding between the participant and the event organizer.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                2. Registration Rules
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Registration is confirmed only after successful payment.</li>
                <li>Each participant must provide accurate personal details.</li>
                <li>Duplicate or fake registrations may be rejected.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                3. Payment Terms
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>All payments are processed securely via Razorpay.</li>
                <li>Registration fees are non-transferable.</li>
                <li>GST (18%) will be applied where applicable.</li>
                <li>If a GST number is provided, it must be valid and active.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                4. GST Clause
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>If a GST number is provided, it will be verified before payment.</li>
                <li>Invalid GST numbers will result in rejection of registration.</li>
                <li>GST details will be reflected in the invoice where applicable.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                5. Cancellation & Refund
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Once registered, cancellation is not allowed.</li>
                <li>No refund will be provided after payment confirmation.</li>
                <li>The organizer reserves the right to cancel or reschedule the event.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                6. Event Changes
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>The organizer may change event date, venue, or schedule.</li>
                <li>Participants will be informed in advance.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                7. Liability
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>The organizer is not responsible for personal loss, injury, or damage during the event.</li>
                <li>Participants attend at their own risk.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                8. Data Usage
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Your personal data will be used only for event-related communication.</li>
                <li>We do not share your data with third parties except payment processors.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">
                9. Acceptance Clause
              </h2>
              <p>
                By proceeding with registration, you confirm that you have read and accepted these Terms & Conditions.
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
