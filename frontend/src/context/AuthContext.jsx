'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const storedOrg = localStorage.getItem('org')
    if (stored) setUser(JSON.parse(stored))
    if (storedOrg) setOrg(JSON.parse(storedOrg))
    setLoading(false)
  }, [])

  function login(token, userData, orgData) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('org', JSON.stringify(orgData))
    setUser(userData)
    setOrg(orgData)
    router.push('/dashboard')
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('org')
    setUser(null)
    setOrg(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, org, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
