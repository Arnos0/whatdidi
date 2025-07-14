'use client'

import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { User, Settings, HelpCircle, LogOut } from 'lucide-react'

export function UserMenu() {
  const { user } = useUser()

  const trigger = (
    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        {user?.imageUrl ? (
          <Image 
            src={user.imageUrl} 
            alt={user.fullName || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <User className="h-5 w-5 text-gray-600" />
        )}
      </div>
      <div className="text-sm text-gray-700">
        {user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User'}
      </div>
    </div>
  )

  return (
    <div className="flex items-center space-x-4">
      {/* Custom user menu */}
      <DropdownMenu trigger={trigger}>
        <DropdownMenuItem>
          <User className="h-4 w-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HelpCircle className="h-4 w-4 mr-2" />
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenu>
      
      {/* Fallback to Clerk's UserButton */}
      <div className="ml-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  )
}