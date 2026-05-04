
import { QuickCreateForm } from "@/components/quick-create-form"

export default function QuickCreatePage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2 py-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quick Registration</h2>
                    {/* <p className="text-muted-foreground">
                        Register new participants instantly without OTP verification.
                    </p> */}
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center py-8">
                <div className="w-full max-w-xl">
                    <QuickCreateForm />
                </div>
            </div>
        </div>
    )
}
