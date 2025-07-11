import { SignUp } from '@clerk/nextjs'

export default function BetaSignUpPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Beta Access
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create your beta account</h1>
        <p className="text-gray-600 mt-2">Welcome to the WhatDidiShop beta program</p>
      </div>
      
      {/* Test: Try rendering SignUp component with explicit props */}
      <div className="bg-white p-8 rounded-lg shadow-lg border max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">🧪 SignUp Component Test</h2>
        <p className="text-gray-600 mb-4">Testing SignUp component rendering:</p>
        
        <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">SignUp component should appear below:</p>
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full"
              }
            }}
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          If you see sign-up form above, the component is working. If not, there&apos;s a configuration issue.
        </p>
      </div>
    </div>
  )
}