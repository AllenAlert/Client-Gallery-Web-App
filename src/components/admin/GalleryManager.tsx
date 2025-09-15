import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { 
  Plus, 
  Camera, 
  FolderOpen, 
  Edit, 
  Eye,
  Share,
  Settings,
  Trash2
} from 'lucide-react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export function GalleryManager({ galleries, onRefresh, supabase }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingGallery, setEditingGallery] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(null)

  const handleCreateGallery = async (e) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.target)
    const galleryData = {
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status') || 'draft',
      privacy: formData.get('privacy') || 'private',
      downloadEnabled: formData.get('downloadEnabled') === 'on',
      favoritesEnabled: formData.get('favoritesEnabled') === 'on',
      commentsEnabled: formData.get('commentsEnabled') === 'on',
      clients: []
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/galleries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(galleryData)
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateDialog(false)
        onRefresh()
        e.target.reset()
      } else {
        console.error('Failed to create gallery:', data.error)
      }
    } catch (error) {
      console.error('Error creating gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditGallery = async (e) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.target)
    const galleryData = {
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status'),
      privacy: formData.get('privacy'),
      downloadEnabled: formData.get('downloadEnabled') === 'on',
      favoritesEnabled: formData.get('favoritesEnabled') === 'on',
      commentsEnabled: formData.get('commentsEnabled') === 'on'
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/galleries/${editingGallery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(galleryData)
      })

      const data = await response.json()
      if (data.success) {
        setShowEditDialog(false)
        setEditingGallery(null)
        onRefresh()
      } else {
        console.error('Failed to update gallery:', data.error)
      }
    } catch (error) {
      console.error('Error updating gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGallery = async (galleryId) => {
    setDeleteLoading(galleryId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/galleries/${galleryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        onRefresh()
      } else {
        console.error('Failed to delete gallery:', data.error)
      }
    } catch (error) {
      console.error('Error deleting gallery:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  const openEditDialog = (gallery) => {
    setEditingGallery(gallery)
    setShowEditDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gallery Management</h2>
          <p className="text-gray-600">Create and manage your photo collections</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Gallery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Gallery</DialogTitle>
              <DialogDescription>
                Create a new photo gallery to organize and share your photos with clients.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGallery} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Gallery Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="e.g., Wedding - Smith Family"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="draft">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Gallery description for clients..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="privacy">Privacy</Label>
                  <Select name="privacy" defaultValue="private">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Password/Link only)</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Gallery Features</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="downloadEnabled" defaultChecked />
                    <span className="text-sm">Enable Downloads</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="favoritesEnabled" defaultChecked />
                    <span className="text-sm">Enable Favorites</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="commentsEnabled" defaultChecked />
                    <span className="text-sm">Enable Comments</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Gallery'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Gallery Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Gallery</DialogTitle>
              <DialogDescription>
                Update gallery settings and information.
              </DialogDescription>
            </DialogHeader>
            {editingGallery && (
              <form onSubmit={handleEditGallery} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Gallery Name *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      required
                      defaultValue={editingGallery.name}
                      placeholder="e.g., Wedding - Smith Family"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={editingGallery.status || 'draft'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingGallery.description || ''}
                    placeholder="Gallery description for clients..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-privacy">Privacy</Label>
                    <Select name="privacy" defaultValue={editingGallery.privacy || 'private'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private (Password/Link only)</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Gallery Features</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        name="downloadEnabled" 
                        defaultChecked={editingGallery.downloadEnabled !== false}
                      />
                      <span className="text-sm">Enable Downloads</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        name="favoritesEnabled" 
                        defaultChecked={editingGallery.favoritesEnabled !== false}
                      />
                      <span className="text-sm">Enable Favorites</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        name="commentsEnabled" 
                        defaultChecked={editingGallery.commentsEnabled !== false}
                      />
                      <span className="text-sm">Enable Comments</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false)
                      setEditingGallery(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Gallery'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {galleries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first gallery to start sharing photos with clients.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Gallery
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gallery) => (
            <Card key={gallery.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      {gallery.photos?.length > 0 ? (
                        <Camera className="w-6 h-6 text-white" />
                      ) : (
                        <FolderOpen className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{gallery.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {gallery.photos?.length || 0} photos
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={gallery.status === 'published' ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {gallery.status || 'draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {gallery.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {gallery.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(gallery)}
                      title="Edit Gallery"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      title="View Gallery"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      title="Share Gallery"
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      title="Gallery Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteLoading === gallery.id}
                        title="Delete Gallery"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Gallery</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{gallery.name}"? This action cannot be undone and will permanently delete all photos in this gallery.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteGallery(gallery.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteLoading === gallery.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Created {new Date(gallery.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}