import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { 
  Plus, 
  Users, 
  Mail, 
  Calendar,
  Eye,
  Settings,
  Trash2
} from 'lucide-react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export function ClientManager({ supabase }) {
  const [clients, setClients] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreateClient = async (e) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.target)
    const clientData = {
      name: formData.get('name'),
      email: formData.get('email'),
      galleries: []
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb71d587/client/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(clientData)
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateDialog(false)
        e.target.reset()
        // Add to local state
        setClients(prev => [...prev, {
          id: data.client.id,
          email: data.client.email,
          name: clientData.name,
          createdAt: new Date().toISOString(),
          galleries: []
        }])
      } else {
        console.error('Failed to create client:', data.error)
      }
    } catch (error) {
      console.error('Error creating client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage client access and permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to give them access to their photo galleries.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <Label htmlFor="client-name">Client Name *</Label>
                <Input
                  id="client-name"
                  name="name"
                  required
                  placeholder="e.g., John & Sarah Smith"
                />
              </div>
              <div>
                <Label htmlFor="client-email">Email Address *</Label>
                <Input
                  id="client-email"
                  name="email"
                  type="email"
                  required
                  placeholder="client@example.com"
                />
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
                  {loading ? 'Creating...' : 'Create Client'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Add clients to share galleries and manage access permissions.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{client.name}</CardTitle>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {client.galleries?.length || 0} galleries
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Added {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Client Access Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <h4 className="font-medium mb-2">How client access works:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Clients are created with a temporary password</li>
                <li>Send clients their login credentials via email</li>
                <li>Assign galleries to clients for viewing and proofing</li>
                <li>Control download permissions and privacy settings per gallery</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Coming Soon</h4>
              <p className="text-sm text-blue-800">
                Email invitations, bulk client import, and advanced permission management
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}