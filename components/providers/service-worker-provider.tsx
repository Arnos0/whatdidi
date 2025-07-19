'use client'

import { useEffect } from 'react'
import { initializeServiceWorker } from '@/lib/utils/service-worker'
import { toast } from 'sonner'

/**
 * Service Worker Provider Component
 * Initializes service worker and handles update notifications
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    // Initialize service worker
    initializeServiceWorker()
      .then(registration => {
        if (registration) {
          console.log('Service Worker initialized successfully')
        }
      })
      .catch(error => {
        console.error('Failed to initialize Service Worker:', error)
      })

    // Listen for service worker updates
    const handleSWUpdate = (event: CustomEvent) => {
      const { registration } = event.detail
      
      toast.info('App update available', {
        description: 'A new version is ready. Reload to update.',
        action: {
          label: 'Reload',
          onClick: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
              // Reload will happen automatically after activation
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload()
              })
            } else {
              window.location.reload()
            }
          }
        },
        duration: 10000 // Show for 10 seconds
      })
    }

    // Listen for back online events
    const handleBackOnline = () => {
      toast.success('Back online', {
        description: 'Your connection has been restored.',
        duration: 3000
      })
    }

    // Listen for app installation prompts
    const handleInstallPrompt = (event: Event) => {
      // Prevent the default install prompt
      event.preventDefault()
      
      // Store the event for later use
      ;(window as any).deferredPrompt = event
      
      // Show custom install notification
      toast.info('Install WhatDidiShop', {
        description: 'Add to your home screen for quick access.',
        action: {
          label: 'Install',
          onClick: () => {
            const deferredPrompt = (window as any).deferredPrompt
            if (deferredPrompt) {
              deferredPrompt.prompt()
              deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                  toast.success('App installed successfully!')
                }
                ;(window as any).deferredPrompt = null
              })
            }
          }
        },
        duration: 8000
      })
    }

    // Add event listeners
    window.addEventListener('swUpdate', handleSWUpdate as EventListener)
    window.addEventListener('backOnline', handleBackOnline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    // Cleanup
    return () => {
      window.removeEventListener('swUpdate', handleSWUpdate as EventListener)
      window.removeEventListener('backOnline', handleBackOnline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  // This component doesn't render anything
  return null
}