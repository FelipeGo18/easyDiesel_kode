import PDFDocument from 'pdfkit';

// ─── Paleta Corporativa ───
const BRAND = {
    primary: '#1B2A4A',   // Azul marino profundo
    secondary: '#2980B9',   // Azul acento
    accent: '#E74C3C',   // Rojo alerta (para badges)
    textDark: '#1C2833',
    textMid: '#566573',
    textLight: '#ABB2B9',
    lineStrong: '#D5D8DC',
    lineSoft: '#EAECEE',
    bgZebra: '#F8F9F9',
    white: '#FFFFFF',
};

const PAGE_W = 612;  // Letter width in points
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Utilidades ───
function humanize(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .replace(/Id$/, '')
        .trim();
}

function formatValue(val: any): string {
    if (val === null || val === undefined) return '—';
    if (val instanceof Date) return val.toLocaleDateString();
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';
    if (typeof val === 'number') return val.toLocaleString();
    const s = String(val);
    // Intentar formatear fechas ISO
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        return new Date(s).toLocaleDateString();
    }
    return s;
}

// ─── Dibujadores ───

function drawHeader(doc: PDFKit.PDFDocument, titulo: string) {
    const y = MARGIN;

    // Barra superior de acento
    doc.save();
    doc.rect(0, 0, PAGE_W, 6).fill(BRAND.secondary);
    doc.restore();

    // Nombre de la empresa
    doc.font('Helvetica-Bold').fontSize(20).fillColor(BRAND.primary)
        .text('EasyDiesel', MARGIN, y + 10);

    // Separador vertical sutil
    doc.moveTo(MARGIN + 120, y + 10).lineTo(MARGIN + 120, y + 35)
        .strokeColor(BRAND.lineStrong).lineWidth(1).stroke();

    // Subtitulo del reporte
    doc.font('Helvetica').fontSize(10).fillColor(BRAND.textMid)
        .text('SISTEMA DE GESTIÓN', MARGIN + 130, y + 12)
        .text('DE COMBUSTIBLES', MARGIN + 130, y + 24);

    // Titulo del reporte a la derecha
    doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.primary)
        .text(titulo.toUpperCase(), MARGIN, y + 50, { width: CONTENT_W, align: 'right' });

    // Fecha
    doc.font('Helvetica').fontSize(8).fillColor(BRAND.textLight)
        .text(`Generado: ${new Date().toLocaleString()}`, MARGIN, y + 65, { width: CONTENT_W, align: 'right' });

    // Línea divisoria gruesa
    doc.moveTo(MARGIN, y + 82).lineTo(MARGIN + CONTENT_W, y + 82)
        .strokeColor(BRAND.primary).lineWidth(2).stroke();

    return y + 95; // siguiente Y disponible
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalRegistros: number) {
    const footerY = 740;
    // Línea fina
    doc.moveTo(MARGIN, footerY).lineTo(MARGIN + CONTENT_W, footerY)
        .strokeColor(BRAND.lineStrong).lineWidth(0.5).stroke();

    doc.font('Helvetica').fontSize(7).fillColor(BRAND.textLight);
    doc.text('EasyDiesel © ' + new Date().getFullYear() + ' — Documento confidencial, generado automáticamente.',
        MARGIN, footerY + 6);
    doc.text(`Total registros: ${totalRegistros}  |  Página ${pageNumber}`,
        MARGIN, footerY + 6, { width: CONTENT_W, align: 'right' });
}

function drawTableHeader(doc: PDFKit.PDFDocument, columns: { key: string; label: string; width: number }[], startY: number): number {
    const rowH = 20;

    // Fondo de cabecera
    doc.save();
    doc.rect(MARGIN, startY, CONTENT_W, rowH).fill(BRAND.primary);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND.white);
    let x = MARGIN + 6;
    columns.forEach(col => {
        doc.text(col.label, x, startY + 6, { width: col.width - 12, align: 'left', lineBreak: false });
        x += col.width;
    });

    return startY + rowH;
}

function drawTableRow(
    doc: PDFKit.PDFDocument,
    columns: { key: string; label: string; width: number }[],
    item: any,
    startY: number,
    isZebra: boolean
): number {
    const rowH = 18;

    if (isZebra) {
        doc.save();
        doc.rect(MARGIN, startY, CONTENT_W, rowH).fill(BRAND.bgZebra);
        doc.restore();
    }

    // Línea inferior sutil
    doc.moveTo(MARGIN, startY + rowH).lineTo(MARGIN + CONTENT_W, startY + rowH)
        .strokeColor(BRAND.lineSoft).lineWidth(0.5).stroke();

    doc.font('Helvetica').fontSize(7.5).fillColor(BRAND.textDark);
    let x = MARGIN + 6;
    columns.forEach(col => {
        const raw = item[col.key];
        let text = formatValue(raw);
        // Truncar si es muy largo para que no rompa la fila
        const maxChars = Math.floor(col.width / 4.5);
        if (text.length > maxChars) text = text.substring(0, maxChars - 2) + '…';

        doc.text(text, x, startY + 5, { width: col.width - 12, align: 'left', lineBreak: false });
        x += col.width;
    });

    return startY + rowH;
}

// ─── Badge de resumen ───
function drawSummaryBadge(doc: PDFKit.PDFDocument, y: number, totalRegistros: number) {
    const badgeW = 160;
    const badgeH = 28;
    const bx = MARGIN;

    doc.save();
    doc.roundedRect(bx, y, badgeW, badgeH, 4).fill(BRAND.secondary);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.white)
        .text(`${totalRegistros} registros encontrados`, bx + 10, y + 8);

    return y + badgeH + 12;
}

// ─══════════════════════════════════════════════
// ─── FUNCIÓN PRINCIPAL ───
// ─══════════════════════════════════════════════

export const generarPDF = async (titulo: string, datos: any[]): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'LETTER',
                layout: 'landscape', // Cambiar a horizontal para más espacio
                margin: MARGIN,
                bufferPages: true,
                info: {
                    Title: `Reporte: ${titulo}`,
                    Author: 'EasyDiesel Platform',
                    Subject: titulo,
                    Creator: 'EasyDiesel Report Engine',
                }
            });

            // Ajustar constantes para horizontal
            const PAGE_W_LANDSCAPE = 792;
            const CONTENT_W_LANDSCAPE = PAGE_W_LANDSCAPE - MARGIN * 2;

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Redefinir drawHeader y drawFooter para el contexto actual (horizontal)
            const drawHeaderLandscape = (doc: PDFKit.PDFDocument, titulo: string) => {
                const y = MARGIN;
                doc.save();
                doc.rect(0, 0, PAGE_W_LANDSCAPE, 6).fill(BRAND.secondary);
                doc.restore();
                doc.font('Helvetica-Bold').fontSize(20).fillColor(BRAND.primary).text('EasyDiesel', MARGIN, y + 10);
                doc.moveTo(MARGIN + 120, y + 10).lineTo(MARGIN + 120, y + 35).strokeColor(BRAND.lineStrong).lineWidth(1).stroke();
                doc.font('Helvetica').fontSize(10).fillColor(BRAND.textMid).text('SISTEMA DE GESTIÓN', MARGIN + 130, y + 12).text('DE COMBUSTIBLES', MARGIN + 130, y + 24);
                doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.primary).text(titulo.toUpperCase(), MARGIN, y + 50, { width: CONTENT_W_LANDSCAPE, align: 'right' });
                doc.font('Helvetica').fontSize(8).fillColor(BRAND.textLight).text(`Generado: ${new Date().toLocaleString()}`, MARGIN, y + 65, { width: CONTENT_W_LANDSCAPE, align: 'right' });
                doc.moveTo(MARGIN, y + 82).lineTo(MARGIN + CONTENT_W_LANDSCAPE, y + 82).strokeColor(BRAND.primary).lineWidth(2).stroke();
                return y + 95;
            };

            const drawFooterLandscape = (doc: PDFKit.PDFDocument, pageNumber: number, totalRegistros: number) => {
                const footerY = 540; // Ajustado para landscape (612 - MARGIN)
                doc.moveTo(MARGIN, footerY).lineTo(MARGIN + CONTENT_W_LANDSCAPE, footerY).strokeColor(BRAND.lineStrong).lineWidth(0.5).stroke();
                doc.font('Helvetica').fontSize(7).fillColor(BRAND.textLight);
                doc.text('EasyDiesel © ' + new Date().getFullYear() + ' — Documento confidencial.', MARGIN, footerY + 6);
                doc.text(`Total registros: ${totalRegistros} | Página ${pageNumber}`, MARGIN, footerY + 6, { width: CONTENT_W_LANDSCAPE, align: 'right' });
            };

            const drawTableHeaderLandscape = (doc: PDFKit.PDFDocument, columns: any[], startY: number) => {
                const rowH = 20;
                doc.save();
                doc.rect(MARGIN, startY, CONTENT_W_LANDSCAPE, rowH).fill(BRAND.primary);
                doc.restore();
                doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND.white);
                let x = MARGIN + 6;
                columns.forEach(col => {
                    doc.text(col.label, x, startY + 6, { width: col.width - 12, align: 'left', lineBreak: false });
                    x += col.width;
                });
                return startY + rowH;
            };

            const drawTableRowLandscape = (doc: PDFKit.PDFDocument, columns: any[], item: any, startY: number, isZebra: boolean) => {
                const rowH = 18;
                if (isZebra) {
                    doc.save();
                    doc.rect(MARGIN, startY, CONTENT_W_LANDSCAPE, rowH).fill(BRAND.bgZebra);
                    doc.restore();
                }
                doc.moveTo(MARGIN, startY + rowH).lineTo(MARGIN + CONTENT_W_LANDSCAPE, startY + rowH).strokeColor(BRAND.lineSoft).lineWidth(0.5).stroke();
                doc.font('Helvetica').fontSize(7.5).fillColor(BRAND.textDark);
                let x = MARGIN + 6;
                columns.forEach(col => {
                    const text = formatValue(item[col.key]);
                    doc.text(text, x, startY + 5, { width: col.width - 12, align: 'left', lineBreak: true, ellipsis: true });
                    x += col.width;
                });
                return startY + rowH;
            };

            // ── Sin datos ──
            if (!datos || datos.length === 0) {
                drawHeaderLandscape(doc, titulo);
                doc.moveDown(3);
                doc.font('Helvetica').fontSize(12).fillColor(BRAND.textMid).text('No hay datos disponibles.', { align: 'center' });
                drawFooterLandscape(doc, 1, 0);
                doc.end();
                return;
            }

            // ── Preparar columnas ──
            const sampleItem = datos[0];
            const columnKeys = Object.keys(sampleItem).filter(key => 
                typeof sampleItem[key] !== 'object' && key !== 'id'
            );

            // Calcular anchos dinámicos
            const totalWidth = CONTENT_W_LANDSCAPE;
            const colW = Math.floor(totalWidth / columnKeys.length);
            const columns = columnKeys.map(key => ({
                key,
                label: humanize(key).toUpperCase(),
                width: colW,
            }));

            // ── Dibujar ──
            let pageNum = 1;
            let cursorY = drawHeaderLandscape(doc, titulo);
            cursorY = drawSummaryBadge(doc, cursorY, datos.length);
            cursorY = drawTableHeaderLandscape(doc, columns, cursorY);

            datos.forEach((item, idx) => {
                // Si no cabe la fila (landscape height es 612), nueva página
                if (cursorY > 520) {
                    drawFooterLandscape(doc, pageNum, datos.length);
                    doc.addPage({ layout: 'landscape' });
                    pageNum++;
                    cursorY = drawHeaderLandscape(doc, titulo);
                    cursorY = drawTableHeaderLandscape(doc, columns, cursorY);
                }
                cursorY = drawTableRowLandscape(doc, columns, item, cursorY, idx % 2 === 0);
            });

            drawFooterLandscape(doc, pageNum, datos.length);
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
