import { SignIn } from '@clerk/nextjs'

export default function SignInVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignIn 
          path="/sign-in/verify"
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