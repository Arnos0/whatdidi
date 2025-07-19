'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference or default to light
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme)
      } else {
        // Check system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setTheme(systemTheme)
      }
    } catch (error) {
      // Fallback to light theme if localStorage is unavailable
      console.warn('localStorage unavailable, using light theme:', error)
      setTheme('light')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      // Update DOM
      document.documentElement.classList.toggle('dark', theme === 'dark')
      // Save to localStorage
      try {
        localStorage.setItem('theme', theme)
      } catch (error) {
        // Silently fail if localStorage is unavailable
        console.warn('Failed to save theme preference:', error)
      }
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}