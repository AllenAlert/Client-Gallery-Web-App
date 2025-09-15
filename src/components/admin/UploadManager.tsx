import React, { useState, useRef } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { 
  Upload, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  FolderOpen
} from 'lucide-react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export function UploadManager({ galleries, onRefresh, supabase }) {
  const [selectedGallery, setSelectedGallery] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      return isImage || isVideo
    })

    const newFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      preview: null
    }))

    // Generate preview URLs for images
    newFiles.forEach(fileObj => {
      if (fileObj.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          fileObj.preview = e.target.result
          setFiles(prev => [...prev])
        }
        reader.readAsDataURL(fileObj.file)
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (!selectedGallery || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let completed = 0
      const total = files.length

      for (const fileObj of files) {
        try {
          fileObj.status = 'uploading'
          setFiles([...files])

          const formData = new FormData()
          formData.append('photo', fileObj.file)

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/admin/galleries/${selectedGallery}/photos`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              },
              body: formData
            }
          )

          const data = await response.json()

          if (data.success) {
            fileObj.status = 'success'
          } else {
            fileObj.status = 'error'
            console.error('Upload failed:', data.error)
          }
        } catch (error) {
          fileObj.status = 'error'
          console.error('Upload error:', error)
        }

        completed++
        setUploadProgress((completed / total) * 100)
        setFiles([...files])
      }

      // Refresh galleries to show new photos
      onRefresh()
    } catch (error) {
      console.error('Upload process error:', error)
    } finally {
      setUploading(false)
      
      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'))
      }, 2000)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <Image className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      case 'uploading':
        return <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Photos</h2>
        <p className="text-gray-600">Add photos and videos to your galleries</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {galleries.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No galleries available</p>
              <p className="text-sm text-gray-500">Create a gallery first to upload photos</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedGallery} onValueChange={setSelectedGallery}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a gallery to upload to..." />
                </SelectTrigger>
                <SelectContent>
                  {galleries.map((gallery) => (
                    <SelectItem key={gallery.id} value={gallery.id}>
                      {gallery.name} ({gallery.photos?.length || 0} photos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedGallery && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Upload Photos & Videos</h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Select Files
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports JPG, PNG, HEIC, MP4, MOV (max 50MB per file)
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upload Queue ({files.length} files)</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={!selectedGallery || uploading || files.length === 0}
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Upload Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {files.map((fileObj) => (
                <div key={fileObj.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {fileObj.preview ? (
                      <img
                        src={fileObj.preview}
                        alt={fileObj.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(fileObj.status)}
                      <h4 className="font-medium truncate">{fileObj.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(fileObj.size)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(fileObj.status)}
                    {!uploading && fileObj.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(fileObj.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}