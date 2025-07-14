import { SignUp } from '@clerk/nextjs'

export default function SignUpVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignUp 
          path="/sign-up/verify"
          routing="path"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border",
            }
          }}
        />
      </div>
    </div>
  )
}