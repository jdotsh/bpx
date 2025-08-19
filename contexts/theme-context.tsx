'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Get initial theme from the script that ran in head
    if (typeof window !== 'undefined' && window.__THEME__) {
      return window.__THEME__ as 'light' | 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    setMounted(true)
    
    // Sync with the theme set by the blocking script
    if (window.__THEME__) {
      setTheme(window.__THEME__ as 'light' | 'dark')
    } else {
      // Fallback if script didn't run
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
      
      setTheme(initialTheme)
      if (!savedTheme) {
        localStorage.setItem('theme', initialTheme)
      }
    }
  }, [])

  const toggleTheme = useCallback(() => {
    if (!mounted) return
    
    const newTheme = theme === 'light' ? 'dark' : 'light'
    
    // Batch DOM updates for better performance
    requestAnimationFrame(() => {
      const root = document.documentElement
      
      // Update state and storage
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
      window.__THEME__ = newTheme
      
      // Apply theme changes
      root.style.colorScheme = newTheme
      
      if (newTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    })
  }, [theme, mounted])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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