import type { Response } from 'express'
import { supabase } from '../lib/supabase.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get clients error:', error)
      res.status(500).json({ error: 'Failed to fetch clients' })
      return
    }

    res.json({ clients })
  } catch (error) {
    console.error('Get clients error:', error)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}

export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    res.json({ client })
  } catch (error) {
    console.error('Get client error:', error)
    res.status(500).json({ error: 'Failed to fetch client' })
  }
}

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, gstin, billingAddress } = req.body

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name,
        email,
        phone,
        gstin,
        billing_address: billingAddress,
        user_id: req.user!.id
      })
      .select()
      .single()

    if (error) {
      console.error('Create client error:', error)
      res.status(500).json({ error: 'Failed to create client' })
      return
    }

    res.status(201).json({
      message: 'Client created successfully',
      client
    })
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ error: 'Failed to create client' })
  }
}

export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, email, phone, gstin, billingAddress } = req.body

    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name,
        email,
        phone,
        gstin,
        billing_address: billingAddress
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single()

    if (error || !client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    res.json({
      message: 'Client updated successfully',
      client
    })
  } catch (error) {
    console.error('Update client error:', error)
    res.status(500).json({ error: 'Failed to update client' })
  }
}

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id)

    if (error) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Delete client error:', error)
    res.status(500).json({ error: 'Failed to delete client' })
  }
}
