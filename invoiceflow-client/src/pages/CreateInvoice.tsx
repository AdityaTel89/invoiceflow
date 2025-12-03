import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  InformationCircleIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import {
  InvoiceSchema,
  type InvoiceFormData,
  COMMON_HSN_SAC,
  INDIAN_STATES,
  UNITS,
  GST_RATES
} from '../types/invoice.types'
import { invoiceService } from '../services/invoiceService'
import axios from 'axios'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  gstin?: string
  billing_address?: string
  state_code?: string
  state_name?: string
}

interface NewClientForm {
  name: string
  email: string
  phone?: string
  gstin?: string
  billing_address?: string
  state_code?: string
  state_name?: string
}

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userState, setUserState] = useState<string>('')
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClient, setNewClient] = useState<NewClientForm>({
    name: '',
    email: '',
    phone: '',
    gstin: '',
    billing_address: '',
    state_code: '',
    state_name: ''
  })
  const [isAddingClient, setIsAddingClient] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_reverse_charge: false,
      items: [{
        description: '',
        hsn_sac: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        discount: 0,
        tax_rate: 18,
        amount: 0
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchItems = watch('items')
  const watchClientId = watch('client_id')
  const watchPlaceOfSupply = watch('place_of_supply')

  // Fetch user data and clients
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch user info
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUserState(userResponse.data.user.state_code || '')
      
      // Fetch clients
      await fetchClients()
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token')
      const clientsResponse = await axios.get('http://localhost:5000/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setClients(clientsResponse.data.clients)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) {
      alert('Name and email are required')
      return
    }

    try {
      setIsAddingClient(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.post(
        'http://localhost:5000/api/clients',
        newClient,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      await fetchClients()
      setValue('client_id', response.data.client.id)
      setShowAddClient(false)
      setNewClient({
        name: '',
        email: '',
        phone: '',
        gstin: '',
        billing_address: '',
        state_code: '',
        state_name: ''
      })
      alert('Client added successfully!')
    } catch (error: any) {
      console.error('Error adding client:', error)
      alert(error.response?.data?.error || 'Failed to add client')
    } finally {
      setIsAddingClient(false)
    }
  }

  // Calculate amount for each item with GST breakdown
  useEffect(() => {
    if (!watchItems || watchItems.length === 0) return
    
    watchItems.forEach((item, index) => {
      // Skip if essential fields are missing
      if (item.quantity === undefined || item.rate === undefined) return
      
      const quantity = Number(item.quantity) || 0
      const rate = Number(item.rate) || 0
      const discount = Number(item.discount) || 0
      const taxRate = Number(item.tax_rate) || 0
      
      const subtotal = quantity * rate
      const taxableValue = subtotal - discount
      const taxAmount = (taxableValue * taxRate) / 100
      const total = taxableValue + taxAmount
      
      // Only update if the calculated amount is different
      const currentAmount = Number(watchItems[index]?.amount) || 0
      const newAmount = parseFloat(total.toFixed(2))
      
      if (Math.abs(currentAmount - newAmount) > 0.01) {
        setValue(`items.${index}.amount`, newAmount, { shouldValidate: false })
      }
    })
  }, [watchItems, setValue])

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if inter-state supply
  const isInterState = () => {
    if (!watchPlaceOfSupply || !userState) return false
    const supplierStateCode = userState
    const placeOfSupplyCode = watchPlaceOfSupply.split('-')[0]
    return supplierStateCode !== placeOfSupplyCode
  }

  const calculateTotals = () => {
    const interState = isInterState()
    
    let subtotal = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    
    // Safely iterate through items
    if (watchItems && Array.isArray(watchItems)) {
      watchItems.forEach((item) => {
        const quantity = Number(item.quantity) || 0
        const rate = Number(item.rate) || 0
        const discount = Number(item.discount) || 0
        const taxRate = Number(item.tax_rate) || 0
        
        const itemSubtotal = quantity * rate
        const taxableValue = itemSubtotal - discount
        const taxAmount = (taxableValue * taxRate) / 100
        
        subtotal += taxableValue
        
        if (interState) {
          totalIgst += taxAmount
        } else {
          totalCgst += taxAmount / 2
          totalSgst += taxAmount / 2
        }
      })
    }

    const taxAmount = totalCgst + totalSgst + totalIgst
    const grandTotal = subtotal + taxAmount
    const roundedTotal = Math.round(grandTotal)
    const roundOff = roundedTotal - grandTotal

    return {
      subtotal: subtotal.toFixed(2),
      cgst: totalCgst.toFixed(2),
      sgst: totalSgst.toFixed(2),
      igst: totalIgst.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: grandTotal.toFixed(2),
      roundedTotal: roundedTotal.toFixed(2),
      roundOff: roundOff.toFixed(2)
    }
  }

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setIsSubmitting(true)
      
      console.log('=== INVOICE CREATION DEBUG ===')
      console.log('Raw form data:', data)
      
      // Validate all required fields
      if (!data.client_id) {
        alert('Please select a client')
        setIsSubmitting(false)
        return
      }
      
      if (!data.invoice_date || !data.due_date) {
        alert('Invoice date and due date are required')
        setIsSubmitting(false)
        return
      }
      
      if (!data.place_of_supply) {
        alert('Place of supply is required')
        setIsSubmitting(false)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        alert('Please add at least one item')
        setIsSubmitting(false)
        return
      }
      
      // Validate each item
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        if (!item.description) {
          alert(`Item ${i + 1}: Description is required`)
          setIsSubmitting(false)
          return
        }
        if (!item.hsn_sac) {
          alert(`Item ${i + 1}: HSN/SAC code is required`)
          setIsSubmitting(false)
          return
        }
        if (item.quantity <= 0) {
          alert(`Item ${i + 1}: Quantity must be greater than 0`)
          setIsSubmitting(false)
          return
        }
        if (item.rate < 0) {
          alert(`Item ${i + 1}: Rate cannot be negative`)
          setIsSubmitting(false)
          return
        }
      }
      
      // Format data to match backend expectations - INCLUDE AMOUNT
      const formattedData = {
        client_id: data.client_id,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        supply_date: data.invoice_date,
        place_of_supply: data.place_of_supply,
        is_reverse_charge: data.is_reverse_charge || false,
        notes: data.notes || '',
        terms_conditions: data.terms_conditions || '',
        items: data.items.map(item => {
          const quantity = Number(item.quantity)
          const rate = Number(item.rate)
          const discount = Number(item.discount) || 0
          const taxRate = Number(item.tax_rate)
          
          const subtotal = quantity * rate
          const taxableValue = subtotal - discount
          const taxAmount = (taxableValue * taxRate) / 100
          const amount = taxableValue + taxAmount
          
          return {
            description: item.description,
            hsn_sac: item.hsn_sac,
            quantity: quantity,
            unit: item.unit || 'NOS',
            rate: rate,
            discount: discount,
            tax_rate: taxRate,
            amount: parseFloat(amount.toFixed(2)) // INCLUDE CALCULATED AMOUNT
          }
        })
      }
      
      console.log('Formatted data being sent:', JSON.stringify(formattedData, null, 2))
      
      const response = await invoiceService.create(formattedData)
      
      console.log('Server response:', response)
      console.log('=== INVOICE CREATED SUCCESSFULLY ===')
      
      alert('Invoice created successfully!')
      navigate('/invoices')
    } catch (error: any) {
      console.error('=== ERROR CREATING INVOICE ===')
      console.error('Error object:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.response?.data?.details ||
                          'Failed to create invoice'
      
      alert(`Error: ${errorMessage}\n\nCheck browser console (F12) for details.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  const steps = [
    { number: 1, title: 'Select Client' },
    { number: 2, title: 'Invoice Details' },
    { number: 3, title: 'Add Items' },
    { number: 4, title: 'Review & Submit' }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Invoices
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
          <p className="text-gray-600 mt-2">GST 2.0 Compliant Invoice Generation</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s.number
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > s.number ? <CheckIcon className="w-6 h-6" /> : s.number}
                </div>
                <span className={`text-sm mt-2 font-medium ${step >= s.number ? 'text-violet-600' : 'text-gray-500'}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 transition-colors duration-300 ${step > s.number ? 'bg-violet-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Client */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Select Client</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddClient(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    Add New Client
                  </button>
                </div>
                
                <div className="mb-4">
                  <input
                    type="search"
                    placeholder="Search clients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>

                {/* Add Client Modal */}
                {showAddClient && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-4 bg-gray-50 border-2 border-violet-600 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">Add New Client</h3>
                      <button
                        type="button"
                        onClick={() => setShowAddClient(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={newClient.name}
                          onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                          placeholder="Client Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                          placeholder="client@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                          placeholder="+91 9876543210"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          value={newClient.gstin}
                          onChange={(e) => setNewClient({ ...newClient, gstin: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                          placeholder="29ABCDE1234F1Z5"
                          maxLength={15}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Billing Address
                        </label>
                        <textarea
                          value={newClient.billing_address}
                          onChange={(e) => setNewClient({ ...newClient, billing_address: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none"
                          placeholder="Full billing address"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <select
                          value={newClient.state_code ? `${newClient.state_code}-${newClient.state_name}` : ''}
                          onChange={(e) => {
                            const [code, ...nameParts] = e.target.value.split('-')
                            setNewClient({
                              ...newClient,
                              state_code: code,
                              state_name: nameParts.join('-')
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state.code} value={`${state.code}-${state.name}`}>
                              {state.code} - {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddClient(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddClient}
                        disabled={isAddingClient}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isAddingClient ? 'Adding...' : 'Add Client'}
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <label
                      key={client.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        watchClientId === client.id
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('client_id')}
                        value={client.id}
                        className="sr-only"
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-600">{client.email}</p>
                          {client.phone && (
                            <p className="text-sm text-gray-500 mt-1">{client.phone}</p>
                          )}
                          {client.gstin && (
                            <p className="text-sm text-gray-500 mt-1">GSTIN: {client.gstin}</p>
                          )}
                        </div>
                        {watchClientId === client.id && (
                          <CheckIcon className="w-6 h-6 text-violet-600 flex-shrink-0" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {errors.client_id && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <InformationCircleIcon className="w-4 h-4" />
                    {errors.client_id.message}
                  </p>
                )}

                {filteredClients.length === 0 && !showAddClient && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium mb-2">No clients found</p>
                    <p className="text-sm mb-4">Click "Add New Client" to create one</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Invoice Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('invoice_date')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                    />
                    {errors.invoice_date && (
                      <p className="text-red-600 text-sm mt-1">{errors.invoice_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('due_date')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                    />
                    {errors.due_date && (
                      <p className="text-red-600 text-sm mt-1">{errors.due_date.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Place of Supply (State) <span className="text-red-600">*</span>
                    </label>
                    <select
                      {...register('place_of_supply')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state.code} value={`${state.code}-${state.name}`}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </select>
                    {errors.place_of_supply && (
                      <p className="text-red-600 text-sm mt-1">{errors.place_of_supply.message}</p>
                    )}
                    {watchPlaceOfSupply && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <InformationCircleIcon className="w-4 h-4" />
                        {isInterState() ? 'Inter-state supply: IGST will be applied' : 'Intra-state supply: CGST + SGST will be applied'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('is_reverse_charge')}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Reverse Charge Applicable
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Check if tax liability is on the recipient instead of supplier
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent resize-none"
                      placeholder="e.g., Payment due within 30 days"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Terms & Conditions (Optional)
                    </label>
                    <textarea
                      {...register('terms_conditions')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent resize-none"
                      placeholder="e.g., Late payment charges applicable after due date..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Add Items */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Add Line Items</h2>
                  <button
                    type="button"
                    onClick={() => append({
                      description: '',
                      hsn_sac: '',
                      quantity: 1,
                      unit: 'NOS',
                      rate: 0,
                      discount: 0,
                      tax_rate: 18,
                      amount: 0
                    })}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">Item #{index + 1}</h3>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-600">*</span>
                          </label>
                          <input
                            {...register(`items.${index}.description`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                            placeholder="e.g., Software Development - 40 hours"
                          />
                          {errors.items?.[index]?.description && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.items[index]?.description?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            HSN/SAC Code <span className="text-red-600">*</span>
                          </label>
                          <input
                            {...register(`items.${index}.hsn_sac`)}
                            list={`hsn-list-${index}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                            placeholder="e.g., 998314"
                          />
                          <datalist id={`hsn-list-${index}`}>
                            {COMMON_HSN_SAC.map((item) => (
                              <option key={item.code} value={item.code}>
                                {item.description}
                              </option>
                            ))}
                          </datalist>
                          {errors.items?.[index]?.hsn_sac && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.items[index]?.hsn_sac?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                            min="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit
                          </label>
                          <select
                            {...register(`items.${index}.unit`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                          >
                            {UNITS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rate (₹) <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.rate`, { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.discount`, { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GST Rate <span className="text-red-600">*</span>
                          </label>
                          <select
                            {...register(`items.${index}.tax_rate`, { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                          >
                            {GST_RATES.map(rate => (
                              <option key={rate.value} value={rate.value}>
                                {rate.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">
                                  ₹{(() => {
                                    const qty = Number(watchItems?.[index]?.quantity) || 0
                                    const rate = Number(watchItems?.[index]?.rate) || 0
                                    return (qty * rate).toFixed(2)
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-red-600">
                                  -₹{(Number(watchItems?.[index]?.discount) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Taxable Value:</span>
                                <span className="font-medium">
                                  ₹{(() => {
                                    const qty = Number(watchItems?.[index]?.quantity) || 0
                                    const rate = Number(watchItems?.[index]?.rate) || 0
                                    const disc = Number(watchItems?.[index]?.discount) || 0
                                    return ((qty * rate) - disc).toFixed(2)
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tax ({Number(watchItems?.[index]?.tax_rate) || 0}%):</span>
                                <span className="font-medium">
                                  ₹{(() => {
                                    const qty = Number(watchItems?.[index]?.quantity) || 0
                                    const rate = Number(watchItems?.[index]?.rate) || 0
                                    const disc = Number(watchItems?.[index]?.discount) || 0
                                    const taxRate = Number(watchItems?.[index]?.tax_rate) || 0
                                    const taxableValue = (qty * rate) - disc
                                    return ((taxableValue * taxRate) / 100).toFixed(2)
                                  })()}
                                </span>
                              </div>
                              <div className="col-span-2 flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                <span>Item Total:</span>
                                <span className="text-violet-600">
                                  ₹{(() => {
                                    const amount = Number(watchItems?.[index]?.amount) || 0
                                    return amount.toFixed(2)
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <InformationCircleIcon className="w-4 h-4" />
                    {errors.items.message}
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Submit</h2>

                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  {/* Header */}
                  <div className="mb-6 pb-6 border-b-2 border-gray-200">
                    <h3 className="text-2xl font-bold text-violet-600 mb-4">TAX INVOICE</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                        <p className="text-gray-700 font-medium">
                          {clients.find(c => c.id === watchClientId)?.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {clients.find(c => c.id === watchClientId)?.email}
                        </p>
                        {clients.find(c => c.id === watchClientId)?.gstin && (
                          <p className="text-gray-600 text-sm">
                            GSTIN: {clients.find(c => c.id === watchClientId)?.gstin}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">Invoice Date</p>
                          <p className="font-medium">{watch('invoice_date')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium">{watch('due_date')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Place of Supply:</p>
                      <p className="font-medium">{watch('place_of_supply')}</p>
                    </div>
                    {watch('is_reverse_charge') && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        <p className="text-sm font-medium text-amber-800">⚠️ Reverse Charge Applicable</p>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-y-2 border-gray-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">#</th>
                          <th className="px-3 py-2 text-left font-semibold">Description</th>
                          <th className="px-3 py-2 text-left font-semibold">HSN/SAC</th>
                          <th className="px-3 py-2 text-right font-semibold">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold">Rate</th>
                          <th className="px-3 py-2 text-right font-semibold">Discount</th>
                          <th className="px-3 py-2 text-right font-semibold">Tax%</th>
                          <th className="px-3 py-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {watchItems?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2">{item.hsn_sac}</td>
                            <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-2 text-right">₹{Number(item.rate).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              {item.discount > 0 ? `-₹${Number(item.discount).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right">{item.tax_rate}%</td>
                            <td className="px-3 py-2 text-right font-semibold">₹{Number(item.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{totals.subtotal}</span>
                      </div>
                      {isInterState() ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">IGST:</span>
                          <span className="font-medium">₹{totals.igst}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">CGST:</span>
                            <span className="font-medium">₹{totals.cgst}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">SGST:</span>
                            <span className="font-medium">₹{totals.sgst}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax Amount:</span>
                        <span className="font-medium">₹{totals.taxAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                        <span className="text-gray-600">Grand Total:</span>
                        <span className="font-medium">₹{totals.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Round Off:</span>
                        <span className="font-medium">{totals.roundOff}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-400">
                        <span>Total Payable:</span>
                        <span className="text-violet-600">₹{totals.roundedTotal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(watch('notes') || watch('terms_conditions')) && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-4">
                      {watch('notes') && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                          <p className="text-gray-600 text-sm whitespace-pre-wrap">{watch('notes')}</p>
                        </div>
                      )}
                      {watch('terms_conditions') && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                          <p className="text-gray-600 text-sm whitespace-pre-wrap">{watch('terms_conditions')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Previous
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                // Validate current step
                if (step === 1 && !watchClientId) {
                  alert('Please select a client')
                  return
                }
                if (step === 2 && (!watch('invoice_date') || !watch('due_date') || !watch('place_of_supply'))) {
                  alert('Please fill all required fields')
                  return
                }
                if (step === 3 && (!watchItems || watchItems.length === 0)) {
                  alert('Please add at least one item')
                  return
                }
                setStep(Math.min(4, step + 1))
              }}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all shadow-lg"
            >
              Next
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Create Invoice
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Summary Card */}
      <div className="mt-6 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl shadow-xl p-6 text-white">
        <h3 className="font-semibold mb-4 text-lg">Invoice Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-200 text-sm">Items</p>
            <p className="text-2xl font-bold">{watchItems?.length || 0}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">Subtotal</p>
            <p className="text-2xl font-bold">₹{totals.subtotal}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">Tax</p>
            <p className="text-2xl font-bold">₹{totals.taxAmount}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">Total</p>
            <p className="text-3xl font-bold">₹{totals.roundedTotal}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
