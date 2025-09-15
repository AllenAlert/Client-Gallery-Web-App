import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Label } from './ui/label'
import { Camera, Users } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export function AuthPage({ supabase }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAdminSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    const name = formData.get('name')
    const businessName = formData.get('businessName')

    try {
      console.log('Attempting admin signup with URL:', `https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/signup`)
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password, name, businessName })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        setMessage(`Server error: ${response.status} - ${errorText}`)
        return
      }

      const data = await response.json()
      console.log('Response data:', data)

      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage('Account created successfully! Signing you in...')
        // Sign in the newly created admin
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setMessage(`Sign in error: ${signInError.message}`)
        }
      }
    } catch (error) {
      console.error('Admin signup error:', error)
      setMessage(`Network error: ${error.message || 'Unable to connect to server'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      setMessage('An error occurred during sign in')
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Client Gallery</h1>
          <p className="text-gray-600 mt-2">Professional photo sharing and proofing</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Admin Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Sign In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Admin Sign Up
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-business">Business Name</Label>
                    <Input
                      id="signup-business"
                      name="businessName"
                      required
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="Create a password"
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Admin Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.includes('error') || message.includes('Error')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}