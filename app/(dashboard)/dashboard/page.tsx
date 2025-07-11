import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            This is where you&apos;ll track all your online purchases and deliveries.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-500">Total orders tracked</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deliveries</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-500">Packages delivered</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Spending</h3>
              <p className="text-3xl font-bold text-purple-600">€0</p>
              <p className="text-sm text-gray-500">Total spent this month</p>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-gray-500 text-sm">
              Phase 2 Complete! Authentication is now working. 
              <br />
              Ready to proceed with Phase 3 - Database Setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}