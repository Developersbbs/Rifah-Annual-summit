import { useState } from "react"
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"
import { app } from "@/lib/firebase"
import { getAuth } from "firebase/auth"

export function usePhoneAuth() {
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const auth = getAuth(app)
    auth.useDeviceLanguage()

    const sendOtp = async (phoneNumber: string) => {
        setLoading(true)
        setError(null)
        try {
            // Clear previous verifier and container before re-initializing
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear()
                } catch (e) {
                    console.warn("Error clearing previous recaptcha:", e)
                }
                window.recaptchaVerifier = undefined
            }

            // Use unique container ID for each reCAPTCHA to avoid "already rendered" error
            const uniqueId = `recaptcha-container-${Date.now()}`
            const container = document.createElement("div")
            container.id = uniqueId
            document.body.appendChild(container)

            // Initialize RecaptchaVerifier with unique container
            window.recaptchaVerifier = new RecaptchaVerifier(auth, uniqueId, {
                size: "invisible",
                callback: () => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                },
                "expired-callback": () => {
                    setError("Recaptcha expired. Please try again.")
                }
            })

            // Firebase handles invisible reCAPTCHA rendering automatically when signInWithPhoneNumber is called
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
            setConfirmationResult(confirmation)

            // Clean up container after successful OTP send
            document.body.removeChild(container)
            return true
        } catch (err: unknown) {
            console.error("Error sending OTP:", err)
            setError(err instanceof Error ? err.message : "Failed to send OTP")
            // Reset recaptcha on error so it can be retried
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear()
                } catch (e) {
                    console.warn("Error clearing recaptcha on error:", e)
                }
                window.recaptchaVerifier = undefined
            }
            return false
        } finally {
            setLoading(false)
        }
    }

    const verifyOtp = async (otp: string) => {
        setLoading(true)
        setError(null)
        try {
            if (!confirmationResult) {
                throw new Error("No OTP sent")
            }
            const result = await confirmationResult.confirm(otp)
            return result.user
        } catch (err: unknown) {
            console.error("Error verifying OTP:", err)
            setError(err instanceof Error ? err.message : "Invalid OTP")
            return null
        } finally {
            setLoading(false)
        }
    }

    return { sendOtp, verifyOtp, loading, error }
}

declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier | undefined
    }
}
