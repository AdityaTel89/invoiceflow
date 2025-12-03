import puppeteer from 'puppeteer'
import type { Invoice } from '../types/invoice.types.js'
import QRCode from 'qrcode'

interface User {
  businessName: string
  email: string
  phone?: string
  gstin?: string
  address?: string
  pan?: string
  stateCode?: string
  stateName?: string
}

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const generateInvoiceHTML = async (invoice: Invoice, user: User): Promise<string> => {
  // Determine if inter-state based on GST amounts [web:51][web:53]
  const igstAmount = parseFloat(String(invoice.igst_amount || 0))
  const cgstAmount = parseFloat(String(invoice.cgst_amount || 0))
  const sgstAmount = parseFloat(String(invoice.sgst_amount || 0))
  const cessAmount = parseFloat(String(invoice.cess_amount || 0))
  const isInterState = igstAmount > 0

  // Generate QR code if IRN exists [web:56]
  let qrCodeDataUrl = ''
  if (invoice.irn_qr_code) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(invoice.irn_qr_code, {
        width: 100,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
    } catch (error) {
      console.error('QR code generation error:', error)
    }
  }

  // Generate items table rows
  const itemsHTML = invoice.items?.map((item, index) => {
    const quantity = parseFloat(String(item.quantity))
    const rate = parseFloat(String(item.rate))
    const discount = parseFloat(String(item.discount || 0))
    const taxableValue = parseFloat(String(item.taxable_value))
    const taxRate = parseFloat(String(item.tax_rate))
    const amount = parseFloat(String(item.amount))

    return `
      <tr>
        <td style="padding: 6px 4px; text-align: center; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 6px 6px; font-size: 9px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #1f2937;">${item.description}</div>
          <div style="color: #6b7280; font-size: 8px; margin-top: 1px;">HSN/SAC: ${item.hsn_sac}</div>
        </td>
        <td style="padding: 6px 4px; text-align: center; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${item.unit || 'NOS'}</td>
        <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${quantity.toFixed(2)}</td>
        <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(rate)}</td>
        <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(taxableValue)}</td>
        <td style="padding: 6px 4px; text-align: center; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${taxRate.toFixed(2)}%</td>
        ${isInterState ? `
          <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(parseFloat(String(item.igst_amount || 0)))}</td>
        ` : `
          <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(parseFloat(String(item.cgst_amount || 0)))}</td>
          <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(parseFloat(String(item.sgst_amount || 0)))}</td>
        `}
        <td style="padding: 6px 4px; text-align: right; font-size: 9px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937;">${formatCurrency(amount)}</td>
      </tr>
    `
  }).join('')

  const subtotal = parseFloat(String(invoice.subtotal))
  const totalAmount = parseFloat(String(invoice.total_amount))
  const roundOff = parseFloat(String(invoice.round_off || 0))

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Helvetica Neue', sans-serif;
          color: #1f2937;
          background: #ffffff;
          line-height: 1.3;
          font-size: 10px;
          height: 297mm;
          width: 210mm;
          position: relative;
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        
        @media print {
          body { margin: 0; padding: 0; }
        }
        
        .invoice-container {
          width: 100%;
          height: 100%;
          padding: 10mm;
          display: flex;
          flex-direction: column;
        }

        /* Brand Color - Purple from your website */
        .brand-primary {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
        }

        .brand-text {
          color: #7c3aed;
        }

        .brand-border {
          border-color: #7c3aed;
        }
        
        /* Header Section */
        .invoice-header {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1.2fr;
          gap: 10px;
          padding-bottom: 8px;
          border-bottom: 3px solid #7c3aed;
          margin-bottom: 8px;
        }
        
        .company-info h1 {
          font-size: 20px;
          font-weight: 700;
          color: #7c3aed;
          margin-bottom: 3px;
          letter-spacing: -0.5px;
        }
        
        .company-info p {
          font-size: 9px;
          color: #4b5563;
          margin: 1px 0;
          line-height: 1.3;
        }
        
        .company-info .gstin-info {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #e5e7eb;
          font-size: 9px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .invoice-title {
          text-align: center;
          padding: 8px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .invoice-title h2 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .invoice-title .original {
          font-size: 7px;
          color: #e9d5ff;
          margin-top: 2px;
          letter-spacing: 0.5px;
        }
        
        .invoice-meta {
          text-align: right;
          font-size: 9px;
        }
        
        .invoice-meta .number {
          font-size: 16px;
          font-weight: 700;
          color: #7c3aed;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }

        .invoice-meta .status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 8px;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          background: ${invoice.status === 'paid' ? '#d1fae5' : invoice.status === 'draft' ? '#e5e7eb' : '#dbeafe'};
          color: ${invoice.status === 'paid' ? '#065f46' : invoice.status === 'draft' ? '#374151' : '#1e40af'};
        }
        
        .invoice-meta .dates p {
          margin: 2px 0;
          color: #4b5563;
        }

        .invoice-meta .dates strong {
          color: #1f2937;
        }
        
        /* Parties Section - Mandatory as per Rule 46 [web:51][web:56] */
        .parties-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .party-box {
          border: 1px solid #d1d5db;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .party-header {
          background: #f3f4f6;
          padding: 5px 8px;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          color: #374151;
          border-bottom: 1px solid #d1d5db;
          letter-spacing: 0.5px;
        }
        
        .party-content {
          padding: 8px;
          font-size: 9px;
          background: #fafafa;
        }
        
        .party-content .name {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 3px;
        }

        .party-content p {
          color: #4b5563;
          margin: 2px 0;
          line-height: 1.4;
        }

        .party-content .gstin-badge {
          display: inline-block;
          background: #ede9fe;
          border: 1px solid #7c3aed;
          color: #5b21b6;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 600;
          margin-top: 3px;
        }

        /* Supply Info - Mandatory [web:53][web:55] */
        .supply-info {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 5px 8px;
          margin-bottom: 8px;
          font-size: 9px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .supply-info strong {
          color: #78350f;
        }

        .reverse-charge-badge {
          background: #fee2e2;
          border: 1px solid #dc2626;
          color: #991b1b;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        /* Items Table - Mandatory fields as per Rule 46 [web:56] */
        .items-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          border: 1px solid #d1d5db;
        }
        
        .items-table thead {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
        }
        
        .items-table th {
          padding: 6px 4px;
          text-align: left;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid #6d28d9;
        }
        
        .items-table tbody tr:nth-child(odd) {
          background: #ffffff;
        }
        
        .items-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }

        .items-table tbody td {
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
        }
        
        /* Totals Section */
        .bottom-section {
          margin-top: auto;
        }

        .totals-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }

        .left-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .amount-words {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 6px 8px;
          font-size: 9px;
        }

        .amount-words strong {
          display: block;
          font-size: 8px;
          color: #78350f;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .amount-words .value {
          color: #1f2937;
          font-style: italic;
          font-weight: 600;
        }

        .bank-details {
          background: #f0f9ff;
          border-left: 3px solid #0284c7;
          padding: 6px 8px;
          font-size: 8px;
        }

        .bank-details strong {
          display: block;
          color: #0c4a6e;
          margin-bottom: 2px;
          font-size: 8px;
          text-transform: uppercase;
        }

        .bank-details p {
          margin: 1px 0;
          color: #1e3a8a;
        }

        .qr-section {
          text-align: center;
        }

        .qr-section img {
          width: 90px;
          height: 90px;
          border: 1px solid #d1d5db;
          padding: 4px;
          background: white;
          border-radius: 3px;
        }

        .qr-section p {
          font-size: 7px;
          color: #6b7280;
          margin-top: 3px;
        }
        
        .totals-box {
          border: 1px solid #d1d5db;
          border-radius: 3px;
          overflow: hidden;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 8px;
          font-size: 9px;
          border-bottom: 1px solid #e5e7eb;
        }

        .total-row:last-child {
          border-bottom: none;
        }

        .total-row.subtotal {
          font-weight: 600;
          background: #f3f4f6;
        }

        .total-row.tax-row {
          color: #4b5563;
          font-size: 9px;
        }
        
        .total-row.grand-total {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 8px;
        }

        /* E-Invoice Section - Mandatory if applicable [web:56] */
        .einvoice-section {
          background: #eff6ff;
          border: 1px solid #60a5fa;
          border-left: 3px solid #2563eb;
          padding: 6px 8px;
          margin-bottom: 6px;
          font-size: 8px;
        }

        .einvoice-section strong {
          color: #1e3a8a;
          display: block;
          margin-bottom: 3px;
          font-size: 8px;
          text-transform: uppercase;
        }

        .einvoice-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .einvoice-item {
          background: white;
          padding: 4px;
          border-radius: 2px;
          font-size: 7px;
        }

        .einvoice-item label {
          display: block;
          color: #1e40af;
          font-weight: 600;
          margin-bottom: 1px;
          font-size: 7px;
        }

        .irn-full {
          grid-column: 1 / -1;
          word-break: break-all;
          font-family: 'Courier New', monospace;
        }

        /* Notes Section */
        .notes-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 6px;
        }

        .note-box {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-left: 3px solid #6b7280;
          padding: 6px;
          font-size: 8px;
        }

        .note-box strong {
          display: block;
          color: #374151;
          margin-bottom: 2px;
          font-size: 8px;
          text-transform: uppercase;
        }

        .note-box p {
          color: #4b5563;
          line-height: 1.4;
          white-space: pre-wrap;
        }
        
        /* Footer Section - Always at bottom */
        .invoice-footer {
          margin-top: auto;
          padding-top: 6px;
          border-top: 2px solid #7c3aed;
        }

        .compliance-notice {
          background: #f0fdf4;
          border-left: 3px solid #16a34a;
          padding: 5px 8px;
          margin-bottom: 6px;
          font-size: 7px;
          line-height: 1.4;
          color: #14532d;
        }

        .compliance-notice strong {
          display: block;
          font-size: 8px;
          margin-bottom: 2px;
          color: #15803d;
        }

        .signature-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 6px 0;
        }

        .signature-box {
          text-align: center;
          width: 45%;
        }

        .signature-line {
          border-top: 1px solid #1f2937;
          margin-top: 30px;
          padding-top: 4px;
          font-size: 8px;
          color: #4b5563;
          font-weight: 600;
        }

        .footer-info {
          text-align: center;
          font-size: 7px;
          color: #6b7280;
          margin-top: 4px;
        }

        .footer-info p {
          margin: 1px 0;
        }

        .footer-info .thank-you {
          font-size: 9px;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 2px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        
        <!-- Header with all mandatory fields [web:51][web:55] -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>${user.businessName}</h1>
            ${user.address ? `<p>${user.address}</p>` : ''}
            ${user.email ? `<p>📧 ${user.email}</p>` : ''}
            ${user.phone ? `<p>📞 ${user.phone}</p>` : ''}
            <div class="gstin-info">
              ${user.gstin ? `GSTIN: ${user.gstin}` : 'GSTIN: Not Registered'}
              ${user.pan ? ` | PAN: ${user.pan}` : ''}
              ${user.stateName ? `<br/>State: ${user.stateName} (Code: ${user.stateCode})` : ''}
            </div>
          </div>
          
          <div class="invoice-title">
            <h2>Tax Invoice</h2>
            <div class="original">ORIGINAL FOR RECIPIENT</div>
          </div>
          
          <div class="invoice-meta">
            <div class="number">${invoice.invoice_number}</div>
            <div class="status">${invoice.status.toUpperCase()}</div>
            <div class="dates">
              <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoice_date)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
              ${invoice.supply_date ? `<p><strong>Supply Date:</strong> ${formatDate(invoice.supply_date)}</p>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Bill To & Ship To - Mandatory [web:52][web:53] -->
        <div class="parties-section">
          <div class="party-box">
            <div class="party-header">📄 Bill To (Recipient Details)</div>
            <div class="party-content">
              <div class="name">${invoice.client?.name}</div>
              ${invoice.client?.billing_address ? `<p>${invoice.client.billing_address}</p>` : ''}
              ${invoice.client?.email ? `<p>📧 ${invoice.client.email}</p>` : ''}
              ${invoice.client?.phone ? `<p>📞 ${invoice.client.phone}</p>` : ''}
              ${invoice.client?.gstin ? 
                `<div class="gstin-badge">GSTIN: ${invoice.client.gstin}</div>` : 
                `<p style="color: #dc2626; font-weight: 600; margin-top: 3px;">⚠️ Unregistered Recipient</p>`
              }
              ${invoice.client?.pan ? `<p style="margin-top: 2px; font-weight: 600;">PAN: ${invoice.client.pan}</p>` : ''}
            </div>
          </div>
          
          <div class="party-box">
            <div class="party-header">🚚 Ship To (Delivery Address)</div>
            <div class="party-content">
              <div class="name">${invoice.client?.name}</div>
              ${invoice.client?.shipping_address || invoice.client?.billing_address ? 
                `<p>${invoice.client.shipping_address || invoice.client.billing_address}</p>` : 
                '<p style="color: #6b7280; font-style: italic;">Same as billing address</p>'
              }
              ${invoice.client?.phone ? `<p>📞 ${invoice.client.phone}</p>` : ''}
              ${invoice.client?.state_name ? `<p style="font-weight: 600;">State: ${invoice.client.state_name} (${invoice.client.state_code})</p>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Place of Supply - Mandatory [web:55][web:56] -->
        <div class="supply-info">
          <div>
            <strong>Place of Supply:</strong> ${invoice.place_of_supply} | 
            <strong>Supply Type:</strong> ${isInterState ? 'Inter-State Supply (IGST Applicable)' : 'Intra-State Supply (CGST + SGST Applicable)'}
          </div>
          ${invoice.is_reverse_charge ? '<div class="reverse-charge-badge">⚠️ Reverse Charge Applicable</div>' : ''}
        </div>
        
        <!-- Items Table - Mandatory fields [web:53][web:56] -->
        <div class="items-section">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 4%; text-align: center;">#</th>
                <th style="width: ${isInterState ? '30%' : '27%'};">Description & HSN/SAC</th>
                <th style="width: 6%; text-align: center;">Unit</th>
                <th style="width: 8%; text-align: right;">Qty</th>
                <th style="width: 10%; text-align: right;">Rate</th>
                <th style="width: 10%; text-align: right;">Taxable Value</th>
                <th style="width: 7%; text-align: center;">Tax %</th>
                ${isInterState ? 
                  `<th style="width: 10%; text-align: right;">IGST</th>` : 
                  `<th style="width: 9%; text-align: right;">CGST</th>
                   <th style="width: 9%; text-align: right;">SGST</th>`
                }
                <th style="width: ${isInterState ? '15%' : '12%'}; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
        </div>
        
        <!-- Bottom Section (Always at bottom) -->
        <div class="bottom-section">
          
          <!-- Totals Grid -->
          <div class="totals-grid">
            <div class="left-section">
              
              <!-- Amount in Words - Mandatory [web:58] -->
              ${invoice.amount_in_words ? `
                <div class="amount-words">
                  <strong>Amount in Words (INR):</strong>
                  <div class="value">${invoice.amount_in_words}</div>
                </div>
              ` : ''}
              
              <!-- Bank Details (Optional but professional) -->
              <div class="bank-details">
                <strong>💳 Payment Information:</strong>
                <p>Payment is due by ${formatDate(invoice.due_date)}</p>
                <p>For bank details, please contact ${user.email}</p>
              </div>

              <!-- QR Code if available [web:56] -->
              ${qrCodeDataUrl ? `
                <div class="qr-section">
                  <img src="${qrCodeDataUrl}" alt="Invoice QR Code"/>
                  <p>Scan to verify invoice authenticity</p>
                </div>
              ` : ''}
            </div>
            
            <!-- Totals Box -->
            <div class="totals-box">
              <div class="total-row subtotal">
                <span>Subtotal (Taxable Value):</span>
                <span>${formatCurrency(subtotal)}</span>
              </div>
              ${isInterState ? `
                <div class="total-row tax-row">
                  <span>IGST (Integrated GST):</span>
                  <span>${formatCurrency(igstAmount)}</span>
                </div>
              ` : `
                <div class="total-row tax-row">
                  <span>CGST (Central GST):</span>
                  <span>${formatCurrency(cgstAmount)}</span>
                </div>
                <div class="total-row tax-row">
                  <span>SGST (State GST):</span>
                  <span>${formatCurrency(sgstAmount)}</span>
                </div>
              `}
              ${cessAmount > 0 ? `
                <div class="total-row tax-row">
                  <span>CESS:</span>
                  <span>${formatCurrency(cessAmount)}</span>
                </div>
              ` : ''}
              ${roundOff !== 0 ? `
                <div class="total-row tax-row">
                  <span>Round Off:</span>
                  <span>${roundOff >= 0 ? '+' : ''}${formatCurrency(Math.abs(roundOff))}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>INVOICE TOTAL:</span>
                <span>${formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <!-- E-Invoice Details if available [web:56] -->
          ${invoice.irn || invoice.irn_ack_no ? `
            <div class="einvoice-section">
              <strong>📄 E-Invoice Details (Invoice Registration Portal - IRP)</strong>
              <div class="einvoice-grid">
                ${invoice.irn ? `
                  <div class="einvoice-item irn-full">
                    <label>IRN (Invoice Reference Number):</label>
                    ${invoice.irn}
                  </div>
                ` : ''}
                ${invoice.irn_ack_no ? `
                  <div class="einvoice-item">
                    <label>Acknowledgement No:</label>
                    ${invoice.irn_ack_no}
                  </div>
                ` : ''}
                ${invoice.irn_ack_date ? `
                  <div class="einvoice-item">
                    <label>Ack Date:</label>
                    ${formatDate(invoice.irn_ack_date)}
                  </div>
                ` : ''}
                ${invoice.eway_bill_no ? `
                  <div class="einvoice-item">
                    <label>E-Way Bill No:</label>
                    ${invoice.eway_bill_no}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Notes & Terms if available -->
          ${invoice.notes || invoice.terms_conditions ? `
            <div class="notes-section">
              ${invoice.notes ? `
                <div class="note-box">
                  <strong>📝 Payment Terms & Notes</strong>
                  <p>${invoice.notes}</p>
                </div>
              ` : ''}
              ${invoice.terms_conditions ? `
                <div class="note-box">
                  <strong>📋 Terms & Conditions</strong>
                  <p>${invoice.terms_conditions}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <!-- Footer Section -->
          <div class="invoice-footer">
            
            <!-- GST Compliance Notice [web:51][web:55] -->
            <div class="compliance-notice">
              <strong>⚖️ GST COMPLIANCE INFORMATION (As per GST Act 2017 & Amendments)</strong>
              • This is a computer-generated invoice as per Rule 48 and does not require a physical signature.
              • Input Tax Credit (ITC) available subject to verification and receipt of goods/services (Section 16).
              • ${isInterState ? 'Inter-State supply under IGST Act 2017' : 'Intra-State supply under CGST & SGST Act 2017'}.
              • E-Invoicing: ${invoice.irn ? 'Invoice reported to IRP with valid IRN.' : 'Mandatory for turnover > ₹5 Cr (₹10 Lakh from Apr 2025).'} (Rule 48)
              • Retain this document for 8 years from the date of filing annual return (Rule 56).
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">
                  Authorized Signatory<br/>
                  <strong>${user.businessName}</strong>
                </div>
              </div>
              
              <div class="signature-box">
                <div class="signature-line">
                  Recipient Acknowledgement<br/>
                  <strong>${invoice.client?.name}</strong>
                </div>
              </div>
            </div>
            
            <!-- Footer Info -->
            <div class="footer-info">
              <p class="thank-you">🙏 Thank You For Your Business!</p>
              <p>This is a system-generated document. For queries, contact ${user.email}${user.phone ? ` | ${user.phone}` : ''}</p>
              <p style="margin-top: 3px;">Generated on: ${formatDateTime(new Date().toISOString())} | Powered by InvoiceFlow</p>
            </div>
          </div>
          
        </div>
        
      </div>
    </body>
    </html>
  `
}

export const generateInvoicePDF = async (
  invoice: Invoice,
  user: User
): Promise<Buffer> => {
  let browser = null
  try {
    console.log('=== PDF GENERATION START ===')
    console.log('Invoice:', invoice.invoice_number)
    
    const html = await generateInvoiceHTML(invoice, user)

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ]
    })

    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false
    })

    await browser.close()
    
    console.log('=== PDF GENERATION SUCCESS ===')
    return Buffer.from(pdfBuffer)
  } catch (error) {
    if (browser) {
      await browser.close()
    }
    console.error('=== PDF GENERATION ERROR ===', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
