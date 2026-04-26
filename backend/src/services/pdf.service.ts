import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface CertificateData {
    certificateNumber: string;
    studentName: string;
    programTitle: string;
    duration: string;
    startDate: Date;
    endDate: Date;
    completionDate: Date;
    trainerName: string;
    skills: string[];
    finalGrade?: string;
}

/**
 * Generate a PDF certificate
 */
export const generateCertificatePDF = async (data: CertificateData): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            // Ensure certificates directory exists
            const certsDir = path.join(__dirname, '../../uploads/certificates');
            if (!fs.existsSync(certsDir)) {
                fs.mkdirSync(certsDir, { recursive: true });
            }

            const filename = `${data.certificateNumber}.pdf`;
            const filepath = path.join(certsDir, filename);

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Pipe to file
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);

            // Page dimensions
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const centerX = pageWidth / 2;

            // Background gradient effect (using rectangles)
            doc.rect(0, 0, pageWidth, pageHeight)
                .fill('#fefefe');

            // Border
            doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
                .lineWidth(3)
                .stroke('#1a365d');

            doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
                .lineWidth(1)
                .stroke('#2b6cb0');

            // Decorative corners
            const cornerSize = 40;
            // Top left
            doc.moveTo(25, 25)
                .lineTo(25 + cornerSize, 25)
                .moveTo(25, 25)
                .lineTo(25, 25 + cornerSize)
                .lineWidth(4)
                .stroke('#667eea');

            // Top right
            doc.moveTo(pageWidth - 25, 25)
                .lineTo(pageWidth - 25 - cornerSize, 25)
                .moveTo(pageWidth - 25, 25)
                .lineTo(pageWidth - 25, 25 + cornerSize)
                .stroke('#667eea');

            // Bottom left
            doc.moveTo(25, pageHeight - 25)
                .lineTo(25 + cornerSize, pageHeight - 25)
                .moveTo(25, pageHeight - 25)
                .lineTo(25, pageHeight - 25 - cornerSize)
                .stroke('#667eea');

            // Bottom right
            doc.moveTo(pageWidth - 25, pageHeight - 25)
                .lineTo(pageWidth - 25 - cornerSize, pageHeight - 25)
                .moveTo(pageWidth - 25, pageHeight - 25)
                .lineTo(pageWidth - 25, pageHeight - 25 - cornerSize)
                .stroke('#667eea');

            // Header - IHUB Logo area
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .fillColor('#667eea')
                .text('IHUB', centerX - 60, 60, { width: 120, align: 'center' });

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#666666')
                .text('ACADEMY', centerX - 40, 78, { width: 80, align: 'center' });

            // Certificate Title
            doc.fontSize(36)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('CERTIFICATE', centerX - 150, 110, { width: 300, align: 'center' });

            doc.fontSize(18)
                .font('Helvetica')
                .fillColor('#2b6cb0')
                .text('OF COMPLETION', centerX - 100, 155, { width: 200, align: 'center' });

            // Decorative line
            doc.moveTo(centerX - 150, 185)
                .lineTo(centerX + 150, 185)
                .lineWidth(2)
                .stroke('#667eea');

            // "This certifies that"
            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#444444')
                .text('This is to certify that', centerX - 100, 210, { width: 200, align: 'center' });

            // Student Name
            doc.fontSize(32)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text(data.studentName, centerX - 200, 240, { width: 400, align: 'center' });

            // Underline for name
            const nameWidth = doc.widthOfString(data.studentName);
            doc.moveTo(centerX - nameWidth / 2 - 20, 280)
                .lineTo(centerX + nameWidth / 2 + 20, 280)
                .lineWidth(1)
                .stroke('#cccccc');

            // "has successfully completed"
            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#444444')
                .text('has successfully completed the', centerX - 120, 300, { width: 240, align: 'center' });

            // Program Title
            doc.fontSize(22)
                .font('Helvetica-Bold')
                .fillColor('#667eea')
                .text(data.programTitle, centerX - 200, 330, { width: 400, align: 'center' });

            // Duration and Date
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#666666')
                .text(`Duration: ${data.duration}`, centerX - 200, 365, { width: 400, align: 'center' });

            doc.text(
                `${data.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${data.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
                centerX - 200, 385, { width: 400, align: 'center' }
            );

            // Skills (if provided)
            if (data.skills && data.skills.length > 0) {
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor('#444444')
                    .text('Skills Acquired:', centerX - 200, 410, { width: 400, align: 'center' });

                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor('#666666')
                    .text(data.skills.join(' • '), centerX - 200, 425, { width: 400, align: 'center' });
            }

            // Signature section
            const signatureY = pageHeight - 130;

            // Trainer signature
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text(data.trainerName, 150, signatureY, { width: 150, align: 'center' });

            doc.moveTo(100, signatureY - 5)
                .lineTo(250, signatureY - 5)
                .lineWidth(1)
                .stroke('#333333');

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#666666')
                .text('Program Trainer', 150, signatureY + 15, { width: 150, align: 'center' });

            // Completion Date
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text(data.completionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), centerX - 75, signatureY, { width: 150, align: 'center' });

            doc.moveTo(centerX - 75, signatureY - 5)
                .lineTo(centerX + 75, signatureY - 5)
                .lineWidth(1)
                .stroke('#333333');

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#666666')
                .text('Date of Completion', centerX - 75, signatureY + 15, { width: 150, align: 'center' });

            // Certificate Number
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text(data.certificateNumber, pageWidth - 300, signatureY, { width: 150, align: 'center' });

            doc.moveTo(pageWidth - 300, signatureY - 5)
                .lineTo(pageWidth - 150, signatureY - 5)
                .lineWidth(1)
                .stroke('#333333');

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#666666')
                .text('Certificate ID', pageWidth - 300, signatureY + 15, { width: 150, align: 'center' });

            // Grade badge (if provided)
            if (data.finalGrade) {
                doc.circle(pageWidth - 80, 80, 30)
                    .lineWidth(2)
                    .fillAndStroke('#667eea', '#1a365d');

                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text(data.finalGrade, pageWidth - 100, 72, { width: 40, align: 'center' });
            }

            // Verification URL
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#999999')
                .text(
                    `Verify at: https://ihub.com/verify/${data.certificateNumber}`,
                    centerX - 150, pageHeight - 50, { width: 300, align: 'center' }
                );

            // Finalize PDF
            doc.end();

            writeStream.on('finish', () => {
                const publicUrl = `/uploads/certificates/${filename}`;
                resolve(publicUrl);
            });

            writeStream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate invoice PDF
 */
export const generateInvoicePDF = async (data: {
    invoiceNumber: string;
    studentName: string;
    studentEmail: string;
    programTitle: string;
    amount: number;
    currency: string;
    issuedAt: Date;
    dueDate: Date;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    status: string;
}): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            // Ensure invoices directory exists
            const invoicesDir = path.join(__dirname, '../../uploads/invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const filename = `${data.invoiceNumber}.pdf`;
            const filepath = path.join(invoicesDir, filename);

            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);

            // Header
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#667eea')
                .text('IHUB', 50, 50);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#666666')
                .text('ACADEMY', 50, 78);

            doc.fontSize(28)
                .font('Helvetica-Bold')
                .fillColor('#333333')
                .text('INVOICE', 400, 50, { align: 'right' });

            // Invoice details
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#666666')
                .text(`Invoice #: ${data.invoiceNumber}`, 400, 85, { align: 'right' })
                .text(`Issue Date: ${data.issuedAt.toLocaleDateString()}`, 400, 100, { align: 'right' })
                .text(`Due Date: ${data.dueDate.toLocaleDateString()}`, 400, 115, { align: 'right' })
                .text(`Status: ${data.status.toUpperCase()}`, 400, 130, { align: 'right' });

            // Bill To
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#333333')
                .text('Bill To:', 50, 150);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#666666')
                .text(data.studentName, 50, 168)
                .text(data.studentEmail, 50, 183);

            // Table header
            const tableTop = 230;
            doc.rect(50, tableTop, 500, 25)
                .fill('#667eea');

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text('Description', 60, tableTop + 7)
                .text('Qty', 320, tableTop + 7, { width: 50, align: 'center' })
                .text('Unit Price', 370, tableTop + 7, { width: 80, align: 'right' })
                .text('Total', 460, tableTop + 7, { width: 80, align: 'right' });

            // Table rows
            let yPos = tableTop + 25;
            data.items.forEach((item, index) => {
                const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
                doc.rect(50, yPos, 500, 25).fill(bgColor);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor('#333333')
                    .text(item.description, 60, yPos + 7, { width: 250 })
                    .text(item.quantity.toString(), 320, yPos + 7, { width: 50, align: 'center' })
                    .text(`${data.currency} ${item.unitPrice.toLocaleString()}`, 370, yPos + 7, { width: 80, align: 'right' })
                    .text(`${data.currency} ${item.total.toLocaleString()}`, 460, yPos + 7, { width: 80, align: 'right' });

                yPos += 25;
            });

            // Total
            doc.rect(370, yPos + 10, 180, 30)
                .fill('#1a365d');

            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text('TOTAL:', 380, yPos + 18)
                .text(`${data.currency} ${data.amount.toLocaleString()}`, 460, yPos + 18, { width: 80, align: 'right' });

            // Footer
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#999999')
                .text('Thank you for choosing IHUB Academy!', 50, 700, { align: 'center', width: 500 })
                .text('For questions, contact: support@ihub.com', 50, 715, { align: 'center', width: 500 });

            doc.end();

            writeStream.on('finish', () => {
                resolve(`/uploads/invoices/${filename}`);
            });

            writeStream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
};

export default {
    generateCertificatePDF,
    generateInvoicePDF
};
