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
      
      {/* Temporary test instead of <SignUp /> */}
      <div className="bg-white p-8 rounded-lg shadow-lg border max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">🧪 TEST MODE</h2>
        <p className="text-gray-600 mb-4">
          If you see this message, the page is working but the SignUp component is not rendering.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Expected:</strong> Clerk SignUp component with email/OAuth options
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Actual:</strong> This test message instead
          </p>
        </div>
      </div>
      
      {/* Uncomment this when test is confirmed */}
      {/* <SignUp /> */}
    </div>
  )
}