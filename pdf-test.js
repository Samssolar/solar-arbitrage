const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Set the output file path
const filePath = path.join(__dirname, 'test-solar.pdf');

// Create a new PDF document
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream(filePath));

// Add content
doc.fontSize(20).text('Solar Arbitrage Test PDF', { align: 'center' });
doc.moveDown();
doc.fontSize(14).text('This is a test PDF generated with Node.js and pdfkit.');
doc.text('Everything looks good if you can see this text in the PDF.');

// Finish the PDF
doc.end();

console.log('PDF generated at', filePath);