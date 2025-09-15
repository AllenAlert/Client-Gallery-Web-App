import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Initialize storage buckets
const initStorage = async () => {
  const bucketName = 'make-cb71d587-gallery-photos'
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false })
    console.log(`Created bucket: ${bucketName}`)
  }
}

// Initialize on startup
initStorage().catch(console.error)

// Health check endpoint
app.get('/make-server-cb71d587/health', (c) => {
  return c.json({ status: 'ok' })
})

// Admin registration route
app.post('/make-server-cb71d587/admin/signup', async (c) => {
  try {
    const { email, password, name, businessName } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        businessName,
        role: 'admin'
      },
      email_confirm: true // Auto-confirm since email server isn't configured
    })
    
    if (error) {
      console.log('Admin signup error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    // Store admin profile data
    await kv.set(`admin:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      businessName,
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Admin signup error:', error)
    return c.json({ error: 'Internal server error during admin signup' }, 500)
  }
})

// Client registration route (created by admin)
app.post('/make-server-cb71d587/client/create', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { email, name, galleries } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8), // Temporary password
      user_metadata: { 
        name,
        role: 'client',
        adminId: user.id
      },
      email_confirm: true
    })
    
    if (error) {
      console.log('Client creation error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    // Store client profile
    await kv.set(`client:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      adminId: user.id,
      galleries: galleries || [],
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, client: data.user })
  } catch (error) {
    console.log('Client creation error:', error)
    return c.json({ error: 'Internal server error during client creation' }, 500)
  }
})

// Get admin galleries
app.get('/make-server-cb71d587/admin/galleries', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const galleries = await kv.getByPrefix(`gallery:${user.id}:`)
    return c.json({ galleries })
  } catch (error) {
    console.log('Get galleries error:', error)
    return c.json({ error: 'Internal server error getting galleries' }, 500)
  }
})

// Create gallery
app.post('/make-server-cb71d587/admin/galleries', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const galleryData = await c.req.json()
    const galleryId = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const gallery = {
      id: galleryId,
      adminId: user.id,
      ...galleryData,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`gallery:${user.id}:${galleryId}`, gallery)
    
    return c.json({ success: true, gallery })
  } catch (error) {
    console.log('Create gallery error:', error)
    return c.json({ error: 'Internal server error creating gallery' }, 500)
  }
})

// Update gallery
app.put('/make-server-cb71d587/admin/galleries/:galleryId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const galleryId = c.req.param('galleryId')
    const updateData = await c.req.json()
    
    const gallery = await kv.get(`gallery:${user.id}:${galleryId}`)
    if (!gallery) {
      return c.json({ error: 'Gallery not found' }, 404)
    }
    
    // Update gallery data
    const updatedGallery = {
      ...gallery,
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`gallery:${user.id}:${galleryId}`, updatedGallery)
    
    return c.json({ success: true, gallery: updatedGallery })
  } catch (error) {
    console.log('Update gallery error:', error)
    return c.json({ error: 'Internal server error updating gallery' }, 500)
  }
})

// Delete gallery
app.delete('/make-server-cb71d587/admin/galleries/:galleryId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const galleryId = c.req.param('galleryId')
    
    const gallery = await kv.get(`gallery:${user.id}:${galleryId}`)
    if (!gallery) {
      return c.json({ error: 'Gallery not found' }, 404)
    }
    
    // Delete photos from storage
    if (gallery.photos && gallery.photos.length > 0) {
      const photoIds = gallery.photos.map(photo => photo.storagePath)
      await supabase.storage
        .from('make-cb71d587-gallery-photos')
        .remove(photoIds)
    }
    
    // Delete gallery from KV store
    await kv.del(`gallery:${user.id}:${galleryId}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Delete gallery error:', error)
    return c.json({ error: 'Internal server error deleting gallery' }, 500)
  }
})

// Upload photo to gallery
app.post('/make-server-cb71d587/admin/galleries/:galleryId/photos', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const galleryId = c.req.param('galleryId')
    const formData = await c.req.formData()
    const file = formData.get('photo') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${galleryId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-cb71d587-gallery-photos')
      .upload(fileName, file)
    
    if (uploadError) {
      console.log('Upload error:', uploadError)
      return c.json({ error: 'Failed to upload photo' }, 500)
    }
    
    // Get gallery and add photo
    const gallery = await kv.get(`gallery:${user.id}:${galleryId}`)
    if (!gallery) {
      return c.json({ error: 'Gallery not found' }, 404)
    }
    
    const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const photo = {
      id: photoId,
      fileName: file.name,
      storagePath: fileName,
      uploadedAt: new Date().toISOString(),
      favorites: [],
      comments: []
    }
    
    gallery.photos = gallery.photos || []
    gallery.photos.push(photo)
    gallery.updatedAt = new Date().toISOString()
    
    await kv.set(`gallery:${user.id}:${galleryId}`, gallery)
    
    return c.json({ success: true, photo })
  } catch (error) {
    console.log('Photo upload error:', error)
    return c.json({ error: 'Internal server error uploading photo' }, 500)
  }
})

// Get client galleries
app.get('/make-server-cb71d587/client/galleries', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientData = await kv.get(`client:${user.id}`)
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    const adminGalleries = await kv.getByPrefix(`gallery:${clientData.adminId}:`)
    
    // Filter galleries that are shared with this client
    const clientGalleries = adminGalleries.filter(gallery => 
      gallery.clients && gallery.clients.includes(user.id)
    )
    
    // Get signed URLs for photos
    for (const gallery of clientGalleries) {
      if (gallery.photos) {
        for (const photo of gallery.photos) {
          const { data: signedUrl } = await supabase.storage
            .from('make-cb71d587-gallery-photos')
            .createSignedUrl(photo.storagePath, 3600)
          photo.url = signedUrl.signedUrl
        }
      }
    }
    
    return c.json({ galleries: clientGalleries })
  } catch (error) {
    console.log('Get client galleries error:', error)
    return c.json({ error: 'Internal server error getting client galleries' }, 500)
  }
})

// Toggle favorite
app.post('/make-server-cb71d587/client/galleries/:galleryId/photos/:photoId/favorite', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const galleryId = c.req.param('galleryId')
    const photoId = c.req.param('photoId')
    
    const clientData = await kv.get(`client:${user.id}`)
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    const gallery = await kv.get(`gallery:${clientData.adminId}:${galleryId}`)
    if (!gallery) {
      return c.json({ error: 'Gallery not found' }, 404)
    }
    
    const photo = gallery.photos.find(p => p.id === photoId)
    if (!photo) {
      return c.json({ error: 'Photo not found' }, 404)
    }
    
    photo.favorites = photo.favorites || []
    const favoriteIndex = photo.favorites.indexOf(user.id)
    
    if (favoriteIndex > -1) {
      photo.favorites.splice(favoriteIndex, 1)
    } else {
      photo.favorites.push(user.id)
    }
    
    await kv.set(`gallery:${clientData.adminId}:${galleryId}`, gallery)
    
    return c.json({ success: true, isFavorite: favoriteIndex === -1 })
  } catch (error) {
    console.log('Toggle favorite error:', error)
    return c.json({ error: 'Internal server error toggling favorite' }, 500)
  }
})

Deno.serve(app.fetch)