import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { GalleryManager } from './admin/GalleryManager'
import { UploadManager } from './admin/UploadManager'
import { ClientManager } from './admin/ClientManager'
import { 
  Camera, 
  FolderOpen, 
  Users, 
  Upload, 
  Settings, 
  LogOut,
  BarChart3
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export function AdminDashboard({ user, supabase, onSignOut }) {
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    fetchGalleries()
  }, [])

  const fetchGalleries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/galleries`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      if (data.galleries) {
        setGalleries(data.galleries)
      }
    } catch (error) {
      console.error('Error fetching galleries:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalGalleries: galleries.length,
    totalPhotos: galleries.reduce((acc, gallery) => acc + (gallery.photos?.length || 0), 0),
    recentActivity: galleries.filter(g => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(g.updatedAt) > weekAgo
    }).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {user.user_metadata?.businessName || 'Gallery Admin'}
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {user.user_metadata?.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="galleries" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Galleries
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Galleries</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGalleries}</div>
                  <p className="text-xs text-muted-foreground">
                    Collections created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Photos</CardTitle>
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                  <p className="text-xs text-muted-foreground">
                    Photos uploaded
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentActivity}</div>
                  <p className="text-xs text-muted-foreground">
                    Updated this week
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Galleries</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : galleries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No galleries created yet</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveTab('galleries')}
                    >
                      Create Your First Gallery
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {galleries.slice(0, 5).map((gallery) => (
                      <div key={gallery.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            {gallery.photos?.length > 0 ? (
                              <Camera className="w-6 h-6 text-gray-400" />
                            ) : (
                              <FolderOpen className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{gallery.name}</h3>
                            <p className="text-sm text-gray-600">
                              {gallery.photos?.length || 0} photos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={gallery.status === 'published' ? 'default' : 'secondary'}>
                            {gallery.status || 'draft'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="galleries">
            <GalleryManager 
              galleries={galleries} 
              onRefresh={fetchGalleries}
              supabase={supabase}
            />
          </TabsContent>

          <TabsContent value="upload">
            <UploadManager 
              galleries={galleries}
              onRefresh={fetchGalleries}
              supabase={supabase}
            />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManager supabase={supabase} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Business Name</label>
                    <p className="text-gray-600">{user.user_metadata?.businessName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-gray-600">{user.user_metadata?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}