import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { GalleryView } from './client/GalleryView'
import { 
  Camera, 
  Heart, 
  Grid3X3, 
  Play,
  LogOut,
  ArrowLeft,
  User
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export function ClientGallery({ user, supabase, onSignOut }) {
  const [galleries, setGalleries] = useState([])
  const [selectedGallery, setSelectedGallery] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGalleries()
  }, [])

  const fetchGalleries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/client/galleries`, {
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

  if (selectedGallery) {
    return (
      <GalleryView 
        gallery={selectedGallery}
        user={user}
        supabase={supabase}
        onBack={() => setSelectedGallery(null)}
        onRefresh={fetchGalleries}
      />
    )
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
                  Your Photo Galleries
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your galleries...</p>
            </div>
          </div>
        ) : galleries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Camera className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries available</h3>
              <p className="text-gray-600 text-center">
                Your photographer hasn't shared any galleries with you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Photo Collections</h2>
              <p className="text-gray-600">
                Click on any gallery below to view, favorite, and download your photos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery) => (
                <Card 
                  key={gallery.id} 
                  className="group hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedGallery(gallery)}
                >
                  <CardHeader className="pb-3">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {gallery.photos && gallery.photos.length > 0 ? (
                        <div className="relative w-full h-full">
                          {gallery.photos[0].url ? (
                            <img
                              src={gallery.photos[0].url}
                              alt={gallery.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-12 h-12 text-gray-400" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    
                    <CardTitle className="text-lg">{gallery.name}</CardTitle>
                    {gallery.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {gallery.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Grid3X3 className="w-4 h-4" />
                          {gallery.photos?.length || 0} photos
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {gallery.photos?.reduce((acc, photo) => 
                            acc + (photo.favorites?.length || 0), 0) || 0} favorites
                        </div>
                      </div>
                      <Badge variant={gallery.status === 'published' ? 'default' : 'secondary'}>
                        {gallery.status || 'draft'}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-500">
                      Updated {new Date(gallery.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}