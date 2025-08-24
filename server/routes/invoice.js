const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Import shared pricing configuration
const { getPlanFeatures } = require('../../shared/pricing.js');

// Generate and download invoice
router.post('/generate-invoice', auth, async (req, res) => {
  try {
    const { plan, price, billing, date } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!plan || !price || !billing || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pixelsqueeze-invoice-${plan.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add company logo/header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('PixelSqueeze', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(14)
       .font('Helvetica')
       .text('Cloud Image Optimization Platform', { align: 'center' })
       .moveDown(2);

    // Add invoice title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('INVOICE', { align: 'center' })
       .moveDown(1);

    // Add invoice details
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Invoice Details:', 50, 200)
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Invoice Number: INV-${Date.now()}`, 70, doc.y)
       .moveDown(0.5);

    doc.text(`Date: ${new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 70, doc.y)
       .moveDown(0.5);

    doc.text(`Plan: ${plan}`, 70, doc.y)
       .moveDown(0.5);

    doc.text(`Billing Cycle: ${billing === 'annual' ? 'Annual' : 'Monthly'}`, 70, doc.y)
       .moveDown(2);

    // Add billing information
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Billing Information:', 50, doc.y)
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Plan: ${plan}`, 70, doc.y)
       .moveDown(0.5);

    doc.text(`Billing: ${billing === 'annual' ? 'Annual' : 'Monthly'}`, 70, doc.y)
       .moveDown(0.5);

    doc.text(`Amount: ₹${price}`, 70, doc.y)
       .moveDown(0.5);

    doc.text(`Tax (18% GST): ₹${(price * 0.18).toFixed(2)}`, 70, doc.y)
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`Total: ₹${(price * 1.18).toFixed(2)}`, 70, doc.y)
       .moveDown(2);

    // Add plan features
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Plan Features:', 50, doc.y)
       .moveDown(0.5);

    const features = getPlanFeatures(plan);
    features.forEach(feature => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• ${feature}`, 70, doc.y)
         .moveDown(0.3);
    });

    doc.moveDown(2);

    // Add footer
    doc.fontSize(10)
       .font('Helvetica')
       .text('Thank you for choosing PixelSqueeze!', { align: 'center' })
       .moveDown(0.5);

    doc.text('For support, contact us at support@pixelsqueeze.com', { align: 'center' })
       .moveDown(0.5);

    doc.text('This is a computer-generated invoice. No signature required.', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

module.exports = router;
