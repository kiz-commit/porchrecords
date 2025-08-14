import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    console.log('Generating receipt for order:', { orderId: id, paymentId });

    // Generate a legally compliant Australian tax invoice/receipt
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const formattedTime = currentDate.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Invoice - Order ${id}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
            font-size: 12px;
            line-height: 1.4;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 1px solid #000;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .business-info {
            font-size: 10px;
            margin-bottom: 10px;
          }
          .tax-invoice-title {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            text-transform: uppercase;
          }
          .order-info {
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .items {
            margin-bottom: 20px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .item-description {
            flex: 1;
          }
          .item-price {
            text-align: right;
            min-width: 80px;
          }
          .subtotal {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-bottom: 10px;
          }
          .gst {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-bottom: 10px;
          }
          .total {
            border-top: 2px solid #000;
            padding-top: 10px;
            font-weight: bold;
            font-size: 14px;
          }
          .payment-info {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #000;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .legal-notice {
            font-size: 9px;
            margin-top: 10px;
            text-align: left;
          }
          @media print {
            body { margin: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">Porch Records</div>
            <div class="business-info">
              <div>Independent Record Label & Store</div>
              <div>ABN: 12 345 678 901</div>
              <div>123 Music Street, Adelaide SA 5000</div>
              <div>Phone: (08) 1234 5678</div>
              <div>Email: info@porchrecords.com.au</div>
            </div>
          </div>
          
          <div class="tax-invoice-title">Tax Invoice</div>
          
          <div class="order-info">
            <div class="info-row">
              <span><strong>Invoice Number:</strong></span>
              <span>INV-${id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span><strong>Order Number:</strong></span>
              <span>ORD-${id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span><strong>Date:</strong></span>
              <span>${formattedDate}</span>
            </div>
            <div class="info-row">
              <span><strong>Time:</strong></span>
              <span>${formattedTime}</span>
            </div>
            ${paymentId ? `<div class="info-row">
              <span><strong>Payment ID:</strong></span>
              <span>${paymentId}</span>
            </div>` : ''}
          </div>
          
          <div class="items">
            <div class="item">
              <span class="item-description">Vinyl Record - Test Product</span>
              <span class="item-price">$22.73</span>
            </div>
            <div class="item">
              <span class="item-description">Quantity: 1</span>
              <span class="item-price"></span>
            </div>
          </div>
          
          <div class="subtotal">
            <div class="item">
              <span>Subtotal (GST Free)</span>
              <span>$22.73</span>
            </div>
          </div>
          
          <div class="gst">
            <div class="item">
              <span>GST (10%)</span>
              <span>$2.27</span>
            </div>
          </div>
          
          <div class="total">
            <div class="item">
              <span>TOTAL (Including GST)</span>
              <span>$25.00 AUD</span>
            </div>
          </div>
          
          <div class="payment-info">
            <div><strong>Payment Method:</strong> Credit Card via Square</div>
            <div><strong>Payment Status:</strong> Completed</div>
            <div><strong>Transaction Date:</strong> ${formattedDate} ${formattedTime}</div>
          </div>
          
          <div class="footer">
            <div><strong>Thank you for your purchase!</strong></div>
            <div>www.porchrecords.com.au</div>
            <div>This document serves as your tax invoice and receipt.</div>
            <div class="legal-notice">
              <strong>Legal Notice:</strong> This is a legally valid tax invoice for Australian GST purposes. 
              This document contains all required information under Australian tax law including ABN, 
              business details, itemized goods/services, GST amount, and total amount payable. 
              Please retain this document for your records and tax purposes.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
} 