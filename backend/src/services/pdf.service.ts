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

            // Header - Bootskills Logo area
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .fillColor('#667eea')
                .text('Bootskills', centerX - 60, 60, { width: 120, align: 'center' });

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
                .text('Bootskills', 50, 50);

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
                .text('Thank you for choosing Bootskills Academy!', 50, 700, { align: 'center', width: 500 })
                .text('For questions, contact: support@bootskills.com', 50, 715, { align: 'center', width: 500 });

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

/**
 * Generate a professional NDA PDF document
 */
export const generateNDAPDF = async (data: {
    ndaId: string;
    applicationTitle: string;
    clientName: string;
    signerName: string;
    signerEmail: string;
    signedAt: Date;
    signatureHash: string;
    signerIp: string;
}): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const ndaDir = path.join(__dirname, '../../uploads/ndas');
            if (!fs.existsSync(ndaDir)) {
                fs.mkdirSync(ndaDir, { recursive: true });
            }

            const filename = `nda_${data.ndaId}.pdf`;
            const filepath = path.join(ndaDir, filename);

            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 60, left: 60, right: 60 }
            });

            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);

            const pageWidth = doc.page.width;
            const pageCenter = pageWidth / 2;
            const margin = 60;
            const contentWidth = pageWidth - 2 * margin;

            // ── Background ──
            doc.rect(0, 0, pageWidth, doc.page.height).fill('#ffffff');

            // ── Decorative top bar ──
            doc.rect(0, 0, pageWidth, 8).fill('#1a365d');
            doc.rect(0, doc.page.height - 8, pageWidth, 8).fill('#1a365d');

            // ── Header ──
            doc.fontSize(22)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('MUTUAL NON-DISCLOSURE AGREEMENT', margin, 40, {
                    width: contentWidth,
                    align: 'center'
                });

            doc.moveTo(margin + 80, 70)
                .lineTo(pageWidth - margin - 80, 70)
                .lineWidth(1.5)
                .stroke('#667eea');

            // ── Document Info ──
            const infoY = 85;
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#666666')
                .text(`Document ID: ${data.ndaId}`, margin, infoY)
                .text(`Date: ${data.signedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, infoY + 12)
                .text(`Status: EXECUTED`, margin, infoY + 24);

            // ── Signature Hash (top right) ──
            doc.fontSize(6)
                .fillColor('#999999')
                .text(`SHA-256: ${data.signatureHash.substring(0, 32)}...`, pageWidth - margin - 200, infoY, { width: 200, align: 'right' });

            // ── Parties Section ──
            const partiesY = 140;
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('PARTIES', margin, partiesY);

            doc.moveTo(margin, partiesY + 3)
                .lineTo(margin + 60, partiesY + 3)
                .lineWidth(1)
                .stroke('#667eea');

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#333333')
                .text('This Mutual Non-Disclosure Agreement (the "Agreement") is entered into by and between:', margin, partiesY + 16);

            const party1Y = partiesY + 38;
            doc.rect(margin, party1Y, contentWidth, 55)
                .fillAndStroke('#f8f9ff', '#e8eaff');

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('PARTY A:', margin + 10, party1Y + 6);

            doc.fontSize(9.5)
                .font('Helvetica')
                .fillColor('#333333')
                .text(data.signerName, margin + 10, party1Y + 22)
                .text(`Email: ${data.signerEmail}`, margin + 10, party1Y + 36);

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('PARTY B:', margin + 180, party1Y + 6);

            doc.fontSize(9.5)
                .font('Helvetica')
                .fillColor('#333333')
                .text('IHUB Academy Ltd', margin + 180, party1Y + 22)
                .text('Email: admin@ihub.com', margin + 180, party1Y + 36);

            // ── Project Reference ──
            const refY = party1Y + 75;
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('PROJECT REFERENCE', margin, refY);

            doc.moveTo(margin, refY + 3)
                .lineTo(margin + 100, refY + 3)
                .lineWidth(1)
                .stroke('#667eea');

            doc.fontSize(9.5)
                .font('Helvetica')
                .fillColor('#333333')
                .text(`"${data.applicationTitle}"`, margin, refY + 18);

            // ─── RECITALS ──
            const recitalsY = refY + 45;
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('RECITALS', margin, recitalsY);

            doc.moveTo(margin, recitalsY + 3)
                .lineTo(margin + 55, recitalsY + 3)
                .lineWidth(1)
                .stroke('#667eea');

            const recitalItems = [
                'WHEREAS, the Parties wish to explore a potential business relationship (the "Purpose") involving the development, review, and implementation of the above-referenced project;',
                'WHEREAS, in the course of discussions and collaborations, each Party may disclose to the other certain proprietary and confidential information;',
                'WHEREAS, the Parties wish to ensure that such confidential information remains protected from unauthorized use or disclosure.'
            ];

            let ry = recitalsY + 20;
            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#444444');

            recitalItems.forEach((recital) => {
                doc.text(`• ${recital}`, margin, ry, {
                    width: contentWidth,
                    align: 'left',
                    lineGap: 4
                });
                ry = doc.y + 4;
            });

            // ─── AGREEMENT ──
            const agreeY = ry + 10;
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('AGREEMENT', margin, agreeY);

            doc.moveTo(margin, agreeY + 3)
                .lineTo(margin + 75, agreeY + 3)
                .lineWidth(1)
                .stroke('#667eea');

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#444444')
                .text('NOW, THEREFORE, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:', margin, agreeY + 18, {
                    width: contentWidth
                });

            // ─── TERMS ──
            const terms = [
                {
                    title: '1. Definition of Confidential Information',
                    text: '"Confidential Information" means any and all technical, business, or financial information, including but not limited to: software code, algorithms, system architectures, product designs, customer databases, business strategies, financial data, trade secrets, and any other proprietary information disclosed by one Party to the other, whether orally, in writing, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.'
                },
                {
                    title: '2. Obligations of Confidentiality',
                    text: 'The Receiving Party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose such information to any third party without the prior written consent of the Disclosing Party; (c) use the Confidential Information solely for the Purpose; and (d) exercise at least the same degree of care in protecting the Confidential Information as the Receiving Party uses to protect its own confidential information of a similar nature, but in no event less than reasonable care.'
                },
                {
                    title: '3. Term and Termination',
                    text: 'This Agreement shall commence on the date of execution and continue for a period of three (3) years (the "Term"). The obligations of confidentiality and non-use shall survive the termination of this Agreement and continue for a period of five (5) years from the date of disclosure of the Confidential Information.'
                },
                {
                    title: '4. Exclusions',
                    text: 'Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was rightfully in the Receiving Party\'s possession prior to disclosure; (c) is independently developed by the Receiving Party without use of Confidential Information; or (d) is required to be disclosed by law, court order, or regulatory authority.'
                },
                {
                    title: '5. Return of Materials',
                    text: 'Upon the written request of the Disclosing Party, or upon termination of the Purpose, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof, and certify in writing that such return or destruction has been completed.'
                }
            ];

            let ty = doc.y + 12;
            terms.forEach((term) => {
                // Check if we need a new page
                if (ty > doc.page.height - 160) {
                    doc.addPage();
                    ty = 60;
                    // Add page header
                    doc.fontSize(9)
                        .font('Helvetica')
                        .fillColor('#999999')
                        .text('Mutual Non-Disclosure Agreement (Continued)', margin, 40, {
                            width: contentWidth,
                            align: 'center'
                        });
                    doc.moveTo(margin, 52)
                        .lineTo(pageWidth - margin, 52)
                        .lineWidth(0.5)
                        .stroke('#cccccc');
                    ty = 65;
                }

                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor('#1a365d')
                    .text(term.title, margin, ty);

                ty = doc.y + 4;

                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor('#444444')
                    .text(term.text, margin, ty, {
                        width: contentWidth,
                        align: 'left',
                        lineGap: 3
                    });

                ty = doc.y + 14;
            });

            // ─── SIGNATURE SECTION ──
            // Move to a new page if needed, or add space
            if (doc.y > doc.page.height - 200) {
                doc.addPage();
                ty = 60;
            } else {
                ty = doc.y + 30;
            }

            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('IN WITNESS WHEREOF', margin, ty);

            doc.moveTo(margin, ty + 3)
                .lineTo(margin + 120, ty + 3)
                .lineWidth(1)
                .stroke('#667eea');

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#444444')
                .text('The Parties have executed this Agreement as of the date set forth below.', margin, ty + 16, {
                    width: contentWidth
                });

            const sigY = ty + 42;

            // Party A Signature Block
            doc.rect(margin, sigY, contentWidth / 2 - 15, 90)
                .fillAndStroke('#f8f9ff', '#e0e3f0');

            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('PARTY A', margin + 10, sigY + 8);

            doc.fontSize(8.5)
                .font('Helvetica')
                .fillColor('#444444')
                .text(data.signerName, margin + 10, sigY + 24);

            // Signature line
            doc.moveTo(margin + 10, sigY + 42)
                .lineTo(margin + contentWidth / 2 - 25, sigY + 42)
                .lineWidth(0.8)
                .stroke('#333333');

            doc.fontSize(7.5)
                .fillColor('#666666')
                .text('Signature', margin + 10, sigY + 46);

            // Timestamp
            doc.moveTo(margin + 10, sigY + 62)
                .lineTo(margin + contentWidth / 2 - 25, sigY + 62)
                .lineWidth(0.8)
                .stroke('#333333');

            doc.fontSize(7.5)
                .fillColor('#666666')
                .text(`Date: ${data.signedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 10, sigY + 66);

            // Party B Signature Block
            doc.rect(margin + contentWidth / 2 + 15, sigY, contentWidth / 2 - 15, 90)
                .fillAndStroke('#f0f4ff', '#d0d8f0');

            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#1a365d')
                .text('PARTY B — IHUB Academy', margin + contentWidth / 2 + 25, sigY + 8);

            doc.fontSize(8.5)
                .font('Helvetica')
                .fillColor('#444444')
                .text('Authorized Representative', margin + contentWidth / 2 + 25, sigY + 24);

            doc.moveTo(margin + contentWidth / 2 + 25, sigY + 42)
                .lineTo(margin + contentWidth - 10, sigY + 42)
                .lineWidth(0.8)
                .stroke('#333333');

            doc.fontSize(7.5)
                .fillColor('#666666')
                .text('Signature', margin + contentWidth / 2 + 25, sigY + 46);

            doc.moveTo(margin + contentWidth / 2 + 25, sigY + 62)
                .lineTo(margin + contentWidth - 10, sigY + 62)
                .lineWidth(0.8)
                .stroke('#333333');

            doc.fontSize(7.5)
                .fillColor('#666666')
                .text(`Date: ${data.signedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + contentWidth / 2 + 25, sigY + 66);

            // ── Audit Footer ──
            const footerY = doc.page.height - 55;

            doc.fontSize(6.5)
                .font('Helvetica')
                .fillColor('#999999')
                .text('This document was executed electronically. The digital signature hash provides cryptographic proof of authenticity.', margin, footerY, {
                    width: contentWidth,
                    align: 'center'
                });

            doc.fontSize(6)
                .fillColor('#aaaaaa')
                .text(`Signed IP: ${data.signerIp}  |  Signature Hash: ${data.signatureHash}`, margin, footerY + 12, {
                    width: contentWidth,
                    align: 'center'
                });

            doc.text(`Document generated on ${new Date().toISOString()}`, margin, footerY + 22, {
                width: contentWidth,
                align: 'center'
            });

            // ── Finalize ──
            doc.end();

            writeStream.on('finish', () => {
                const publicUrl = `/uploads/ndas/${filename}`;
                resolve(publicUrl);
            });

            writeStream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
};

export default {
    generateCertificatePDF,
    generateInvoicePDF,
    generateNDAPDF
};
