'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { EmailProvider } from '@/lib/supabase/types'
import { toast } from 'sonner'

interface EmailAccount {
  id: string
  provider: EmailProvider
  email: string
  scan_enabled: boolean
  last_scan_at: string | null
  created_at: string
  updated_at: string
}

interface EmailAccountsResponse {
  accounts: EmailAccount[]
}

export function useEmailAccounts() {
  return useQuery<EmailAccountsResponse>({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/email-accounts')
      
      if (!response.ok) {
        throw new Error('Failed to fetch email accounts')
      }

      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useConnectEmail() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (provider: EmailProvider) => {
      // Redirect to OAuth authorization endpoint
      const authUrl = provider === 'gmail' 
        ? '/api/auth/google/authorize'
        : '/api/auth/microsoft/authorize'
      
      router.push(authUrl)
    },
    onError: (error: Error) => {
      toast.error('Failed to connect email account')
    },
  })
}

export function useDisconnectEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/email-accounts/${accountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect email account')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate email accounts query to refetch
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      toast.success('Email account disconnected')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect email account')
    },
  })
}