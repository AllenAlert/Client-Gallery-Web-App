import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { 
  ArrowLeft, 
  Heart, 
  Download, 
  MessageSquare, 
  Grid3X3, 
  Maximize2,
  Play,
  ChevronLeft,
  ChevronRight,
  Send,
  X
} from 'lucide-react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export function GalleryView({ gallery, user, supabase, onBack, onRefresh }) {
  const [viewMode, setViewMode] = useState('grid') // grid, slideshow
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)

  const photos = gallery.photos || []

  const toggleFavorite = async (photoId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/client/galleries/${gallery.id}/photos/${photoId}/favorite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      const data = await response.json()
      if (data.success) {
        // Update local state
        const updatedPhotos = photos.map(photo => {
          if (photo.id === photoId) {
            const favorites = photo.favorites || []
            if (data.isFavorite) {
              return { ...photo, favorites: [...favorites, user.id] }
            } else {
              return { ...photo, favorites: favorites.filter(id => id !== user.id) }
            }
          }
          return photo
        })
        
        gallery.photos = updatedPhotos
        onRefresh()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const addComment = async (photoId) => {
    if (!commentText.trim()) return

    setLoading(true)
    try {
      // This would be implemented in the backend
      console.log('Adding comment to photo:', photoId, commentText)
      setCommentText('')
      setShowCommentDialog(false)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigatePhoto = (direction) => {
    const newIndex = direction === 'next' 
      ? (selectedIndex + 1) % photos.length
      : (selectedIndex - 1 + photos.length) % photos.length
    
    setSelectedIndex(newIndex)
    setSelectedPhoto(photos[newIndex])
  }

  const isFavorited = (photo) => {
    return photo.favorites && photo.favorites.includes(user.id)
  }

  if (viewMode === 'slideshow' && selectedPhoto) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-75">
          <Button
            variant="ghost"
            onClick={() => {
              setViewMode('grid')
              setSelectedPhoto(null)
            }}
            className="text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5 mr-2" />
            Exit Slideshow
          </Button>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => toggleFavorite(selectedPhoto.id)}
              className={`text-white hover:bg-gray-800 ${
                isFavorited(selectedPhoto) ? 'text-red-400' : ''
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited(selectedPhoto) ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setShowCommentDialog(true)}
              className="text-white hover:bg-gray-800"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            
            <span className="text-white text-sm">
              {selectedIndex + 1} of {photos.length}
            </span>
          </div>
        </div>

        <div className="relative h-full pb-20 pt-16">
          <div className="flex items-center justify-center h-full px-16">
            <Button
              variant="ghost"
              onClick={() => navigatePhoto('prev')}
              className="absolute left-4 text-white hover:bg-gray-800 z-10"
              disabled={photos.length <= 1}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.fileName}
              className="max-w-full max-h-full object-contain"
            />

            <Button
              variant="ghost"
              onClick={() => navigatePhoto('next')}
              className="absolute right-4 text-white hover:bg-gray-800 z-10"
              disabled={photos.length <= 1}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Galleries
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{gallery.name}</h1>
                {gallery.description && (
                  <p className="text-sm text-gray-600">{gallery.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Grid3X3 className="w-3 h-3" />
                {photos.length} photos
              </Badge>
              <Button
                variant="outline"
                onClick={() => {
                  if (photos.length > 0) {
                    setSelectedPhoto(photos[0])
                    setSelectedIndex(0)
                    setViewMode('slideshow')
                  }
                }}
                disabled={photos.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Slideshow
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Grid3X3 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
              <p className="text-gray-600 text-center">
                This gallery doesn't have any photos uploaded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => {
                    setSelectedPhoto(photo)
                    setSelectedIndex(index)
                    setViewMode('slideshow')
                  }}
                />
                
                {/* Overlay controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(photo.id)
                      }}
                      className={`${
                        isFavorited(photo) 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited(photo) ? 'fill-current' : ''}`} />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPhoto(photo)
                        setShowCommentDialog(true)
                      }}
                      className="bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Download functionality would be implemented here
                      }}
                      className="bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Favorite indicator */}
                {isFavorited(photo) && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <Heart className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment or edit request for this photo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPhoto && (
              <div className="flex items-center gap-3">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.fileName}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{selectedPhoto.fileName}</p>
                  <p className="text-sm text-gray-600">Add a note or edit request</p>
                </div>
              </div>
            )}
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comment or edit request..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCommentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedPhoto && addComment(selectedPhoto.id)}
                disabled={loading || !commentText.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}