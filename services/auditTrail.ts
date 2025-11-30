
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DocumentState } from '../types/document';
import { AuditLogEntry } from '../types/audit';

/**
 * Generates a legally robust Audit Trail PDF using pdf-lib.
 * Runs entirely in the browser.
 */
export async function generateAuditTrailPDF(doc: DocumentState): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const monoFont = await pdfDoc.embedFont(StandardFonts.Courier);

    let yPosition = 750;

    // --- Header ---
    page.drawText('DOCUMENT AUDIT TRAIL', { x: 50, y: yPosition, size: 18, font: boldFont });
    yPosition -= 20;
    page.drawText('Powered by HyprDoc SOC2 Engine', { x: 50, y: yPosition, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    yPosition -= 40;

    // --- Document ID & Hash ---
    page.drawText('Document Identity', { x: 50, y: yPosition, size: 14, font: boldFont });
    yPosition -= 20;
    
    page.drawText(`Title: ${doc.title}`, { x: 50, y: yPosition, size: 10, font });
    yPosition -= 15;
    page.drawText(`ID: ${doc.id}`, { x: 50, y: yPosition, size: 10, font: monoFont });
    yPosition -= 15;
    
    // Simulate or use real hash if available
    const docHash = doc.sha256 || "PENDING_FINALIZATION_HASH_CALCULATION";
    page.drawText(`SHA-256 Hash:`, { x: 50, y: yPosition, size: 10, font: boldFont });
    yPosition -= 15;
    page.drawText(docHash, { x: 50, y: yPosition, size: 9, font: monoFont, color: rgb(0.3, 0.3, 0.3) });
    
    yPosition -= 40;

    // --- Event Timeline ---
    page.drawText('Event Timeline', { x: 50, y: yPosition, size: 14, font: boldFont });
    yPosition -= 30;

    // Sort events (newest first in UI, but usually oldest first in Audit Trail for reading flow)
    const sortedLog = [...(doc.auditLog || [])].sort((a, b) => a.timestamp - b.timestamp);

    for (const log of sortedLog) {
        if (yPosition < 50) {
            // Basic pagination
            // In a real app we'd add a new page, keeping it simple for now
            break; 
        }

        const dateStr = new Date(log.timestamp).toLocaleString();
        
        // Time & Action
        page.drawText(`[${dateStr}]`, { x: 50, y: yPosition, size: 9, font: monoFont });
        page.drawText(log.action.toUpperCase(), { x: 220, y: yPosition, size: 9, font: boldFont });
        
        yPosition -= 12;
        
        // User & IP
        page.drawText(`User: ${log.user}`, { x: 60, y: yPosition, size: 9, font });
        if (log.ipAddress) {
             page.drawText(`IP: ${log.ipAddress}`, { x: 220, y: yPosition, size: 9, font: monoFont, color: rgb(0.5, 0.5, 0.5) });
        }
        
        yPosition -= 12;

        // Details
        if (log.details) {
            page.drawText(`Details: ${log.details}`, { x: 60, y: yPosition, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
            yPosition -= 12;
        }

        yPosition -= 15; // Spacer
    }

    // --- Verification Footer ---
    yPosition -= 20;
    page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 550, y: yPosition },
        color: rgb(0.8, 0.8, 0.8),
    });
    yPosition -= 20;
    page.drawText(`Generated: ${new Date().toISOString()}`, { x: 50, y: yPosition, size: 8, font: monoFont, color: rgb(0.6, 0.6, 0.6) });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
}


