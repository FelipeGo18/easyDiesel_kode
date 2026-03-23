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
                layout: 'landscape',
                margin: 0,
                autoFirstPage: true, // Volver al estándar para evitar páginas fantasma
                bufferPages: true
            });

            const PAGE_W = 792;
            const PAGE_H = 612;
            const CONTENT_W = PAGE_W - (MARGIN * 2);
            const TOP_LIMIT = 140; // Más espacio para el header
            const BOTTOM_LIMIT = 540;

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // ─── Funciones de Dibujo ───

            const drawPageDecoration = (titulo: string, pageIdx: number, totalPages: number, totalRegs: number) => {
                const y = MARGIN;
                doc.save();
                // Franja decorativa superior
                doc.rect(0, 0, PAGE_W, 6).fill(BRAND.secondary);
                doc.restore();

                // Logo y Textos institucionales
                doc.font('Helvetica-Bold').fontSize(20).fillColor(BRAND.primary).text('EasyDiesel', MARGIN, y + 5);
                doc.moveTo(MARGIN + 120, y + 5).lineTo(MARGIN + 120, y + 30).strokeColor(BRAND.lineStrong).lineWidth(1).stroke();
                doc.font('Helvetica').fontSize(10).fillColor(BRAND.textMid).text('SISTEMA DE GESTIÓN', MARGIN + 130, y + 7).text('DE COMBUSTIBLES', MARGIN + 130, y + 19);
                
                // Título del reporte y fecha (Derecha)
                doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.primary).text(titulo.toUpperCase(), MARGIN, y + 40, { width: CONTENT_W, align: 'right' });
                doc.font('Helvetica').fontSize(8).fillColor(BRAND.textLight).text(`Generado: ${new Date().toLocaleString()}`, MARGIN, y + 53, { width: CONTENT_W, align: 'right' });
                
                // Línea divisoria principal
                doc.moveTo(MARGIN, y + 70).lineTo(MARGIN + CONTENT_W, y + 70).strokeColor(BRAND.primary).lineWidth(2).stroke();

                // Footer
                const footerY = 560;
                doc.moveTo(MARGIN, footerY).lineTo(MARGIN + CONTENT_W, footerY).strokeColor(BRAND.lineStrong).lineWidth(0.5).stroke();
                doc.font('Helvetica').fontSize(7).fillColor(BRAND.textLight);
                doc.text('EasyDiesel © ' + new Date().getFullYear() + ' — Documento confidencial.', MARGIN, footerY + 10);
                doc.text(`Total registros: ${totalRegs} | Página ${pageIdx + 1} de ${totalPages}`, MARGIN, footerY + 10, { width: CONTENT_W, align: 'right' });
            };

            // ─── Lógica de Contenido ───

            if (!datos || datos.length === 0) {
                doc.addPage();
                doc.font('Helvetica').fontSize(12).fillColor(BRAND.textMid).text('No hay datos disponibles.', MARGIN, 200, { align: 'center', width: CONTENT_W });
            } else {
                // Preparar columnas
                const sampleItem = datos[0];
                const columnKeys = Object.keys(sampleItem).filter(key => typeof sampleItem[key] !== 'object' && key !== 'id');
                
                const columns = columnKeys.map(key => {
                    let weight = 1;
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('titulo') || lowerKey.includes('descripcion') || lowerKey.includes('entidad')) weight = 2.2; // Reducido un poco
                    else if (lowerKey.includes('id') || lowerKey.includes('fecha') || lowerKey.includes('precio') || lowerKey.includes('galon')) weight = 0.7;
                    return { key, label: humanize(key).toUpperCase(), weight };
                });

                const totalWeight = columns.reduce((acc, col) => acc + col.weight, 0);
                const finalColumns = columns.map(col => ({ ...col, width: Math.floor((col.weight / totalWeight) * CONTENT_W) }));

                let cursorY = TOP_LIMIT;

                const startNewPage = () => {
                    // Si ya hay una página, PDFKit añadirá la siguiente. 
                    // Si es la primera llamada, doc.addPage() creará la primera página real (evitando la inicial en blanco)
                    doc.addPage();
                    cursorY = TOP_LIMIT;
                    // Dibujar cabecera de tabla
                    doc.save();
                    doc.rect(MARGIN, cursorY, CONTENT_W, 22).fill(BRAND.primary);
                    doc.restore();
                    doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND.white);
                    let tx = MARGIN + 6;
                    finalColumns.forEach(col => {
                        doc.text(col.label, tx, cursorY + 7, { width: col.width - 12, lineBreak: false });
                        tx += col.width;
                    });
                    cursorY += 22;
                };

                // Iniciar la primera página con contenido
                startNewPage();
                
                // Badge de resumen (solo en la primera página)
                const badgeH = 28;
                doc.save();
                doc.roundedRect(MARGIN, cursorY + 10, 160, badgeH, 4).fill(BRAND.secondary);
                doc.restore();
                doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.white).text(`${datos.length} registros encontrados`, MARGIN + 10, cursorY + 18);
                cursorY += badgeH + 25;

                datos.forEach((item, idx) => {
                    doc.font('Helvetica').fontSize(7.5);
                    let rowH = 18;
                    finalColumns.forEach(col => {
                        const h = doc.heightOfString(formatValue(item[col.key]), { width: col.width - 12 });
                        if (h + 8 > rowH) rowH = h + 8;
                    });

                    if (cursorY + rowH > BOTTOM_LIMIT) {
                        startNewPage();
                    }

                    if (idx % 2 === 0) {
                        doc.save().rect(MARGIN, cursorY, CONTENT_W, rowH).fill(BRAND.bgZebra).restore();
                    }
                    doc.moveTo(MARGIN, cursorY + rowH).lineTo(MARGIN + CONTENT_W, cursorY + rowH).strokeColor(BRAND.lineSoft).lineWidth(0.5).stroke();

                    doc.fillColor(BRAND.textDark);
                    let rx = MARGIN + 6;
                    finalColumns.forEach(col => {
                        doc.text(formatValue(item[col.key]), rx, cursorY + 4, { width: col.width - 12, lineBreak: true });
                        rx += col.width;
                    });
                    cursorY += rowH;
                });
            }

            // ─── Post-procesar páginas para Header/Footer ───
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                drawPageDecoration(titulo, i, range.count, datos.length);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
