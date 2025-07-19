/**
 * Service Worker registration and management utilities
 */

// Remove global declarations as they conflict with built-in types
// ServiceWorker types are already available in the DOM lib

export interface ServiceWorkerUpdateInfo {
  hasUpdate: boolean
  registration?: ServiceWorkerRegistration
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    })

    console.log('Service Worker registered successfully:', registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        console.log('Service Worker update found')
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('Service Worker update available')
            // Notify the app about the update
            notifyAboutUpdate(registration)
          }
        })
      }
    })

    // Check for updates periodically
    setInterval(() => {
      registration.update()
    }, 60000) // Check every minute

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<ServiceWorkerUpdateInfo> {
  if (!('serviceWorker' in navigator)) {
    return { hasUpdate: false }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return { hasUpdate: false }
    }

    await registration.update()
    
    const hasUpdate = registration.waiting !== null
    return { hasUpdate, registration }
  } catch (error) {
    console.error('Failed to check for updates:', error)
    return { hasUpdate: false }
  }
}

/**
 * Activate waiting service worker
 */
export function activateUpdate(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    
    // Reload page after activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const result = await registration.unregister()
      console.log('Service Worker unregistered:', result)
      return result
    }
    return true
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
    return false
  }
}

/**
 * Get service worker status
 */
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean
  registered: boolean
  active: boolean
  waiting: boolean
}> {
  const supported = 'serviceWorker' in navigator
  
  if (!supported) {
    return { supported: false, registered: false, active: false, waiting: false }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    const registered = !!registration
    const active = !!(registration?.active)
    const waiting = !!(registration?.waiting)

    return { supported, registered, active, waiting }
  } catch (error) {
    console.error('Failed to get service worker status:', error)
    return { supported, registered: false, active: false, waiting: false }
  }
}

/**
 * Notify about service worker updates
 */
function notifyAboutUpdate(registration: ServiceWorkerRegistration): void {
  // This would integrate with your notification system
  console.log('Service Worker update available')
  
  // Dispatch custom event for the app to handle
  window.dispatchEvent(new CustomEvent('swUpdate', {
    detail: { registration }
  }))
}

/**
 * Listen for service worker messages
 */
export function listenForServiceWorkerMessages(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.addEventListener('message', event => {
    const { type, payload } = event.data
    
    switch (type) {
      case 'BACK_ONLINE':
        console.log('Service Worker: Back online')
        // Trigger any necessary updates
        window.dispatchEvent(new CustomEvent('backOnline'))
        break
      
      case 'CACHE_UPDATED':
        console.log('Service Worker: Cache updated', payload)
        break
      
      default:
        console.log('Service Worker message:', event.data)
    }
  })
}

/**
 * Send message to service worker
 */
export function sendMessageToServiceWorker(message: any): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return
  }

  navigator.serviceWorker.controller.postMessage(message)
}

/**
 * Initialize service worker with all event listeners
 */
export async function initializeServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Only register in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SW_ENABLED !== 'true') {
    console.log('Service Worker disabled in development')
    return null
  }

  const registration = await registerServiceWorker()
  
  if (registration) {
    listenForServiceWorkerMessages()
    
    // Set up periodic update checks
    window.addEventListener('focus', () => {
      checkForUpdates()
    })
    
    // Handle online/offline events
    window.addEventListener('online', () => {
      sendMessageToServiceWorker({ type: 'ONLINE' })
    })
    
    window.addEventListener('offline', () => {
      sendMessageToServiceWorker({ type: 'OFFLINE' })
    })
  }
  
  return registration
}