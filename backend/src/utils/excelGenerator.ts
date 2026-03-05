import ExcelJS from 'exceljs';

// ─── Paleta Corporativa ───
const BRAND = {
    primary: 'FF1B2A4A',  // Azul marino profundo
    secondary: 'FF2980B9',  // Azul acento
    textDark: 'FF1C2833',
    textMid: 'FF566573',
    textLight: 'FFABB2B9',
    lineStrong: 'FFD5D8DC',
    lineSoft: 'FFEAECEE',
    bgZebra: 'FFF8F9F9',
    white: 'FFFFFFFF',
};

function humanize(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .replace(/Id$/, '')
        .trim();
}

// ═══════════════════════════════════════════════
//  GENERADOR EXCEL — Diseño Corporativo Premium
// ═══════════════════════════════════════════════

export const generarExcel = async (titulo: string, datos: any[]): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyDiesel Platform';
    workbook.created = new Date();
    workbook.properties.date1904 = false;

    const sheet = workbook.addWorksheet('Reporte', {
        views: [{ showGridLines: false }],
        properties: { defaultColWidth: 18 }
    });

    // ── Determinar columnas ──
    const columnKeys = datos && datos.length > 0
        ? Object.keys(datos[0]).filter(key => typeof datos[0][key] !== 'object' && key !== 'id')
        : [];

    const numCols = Math.max(columnKeys.length, 6);
    const lastColLetter = String.fromCharCode(64 + numCols); // A=65, B=66...

    // ───────────────────────────────────────
    // FILA 1: Barra de acento (accent stripe)
    // ───────────────────────────────────────
    const accentRow = sheet.getRow(1);
    accentRow.height = 6;
    sheet.mergeCells(`A1:${lastColLetter}1`);
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.secondary } };

    // ───────────────────────────────────────
    // FILA 2: Logo / Nombre de empresa
    // ───────────────────────────────────────
    const brandRow = sheet.getRow(2);
    brandRow.height = 36;
    sheet.mergeCells(`A2:${lastColLetter}2`);
    const brandCell = sheet.getCell('A2');
    brandCell.value = 'EasyDiesel';
    brandCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: BRAND.primary } };
    brandCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // ───────────────────────────────────────
    // FILA 3: Subtítulo "Sistema de Gestión de Combustibles"
    // ───────────────────────────────────────
    sheet.mergeCells(`A3:${lastColLetter}3`);
    const subBrandCell = sheet.getCell('A3');
    subBrandCell.value = 'Sistema de Gestión de Combustibles';
    subBrandCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: BRAND.textLight } };
    subBrandCell.alignment = { vertical: 'top', horizontal: 'left', indent: 1 };

    // ───────────────────────────────────────
    // FILA 4: Línea vacía como separador
    // ───────────────────────────────────────
    sheet.getRow(4).height = 8;

    // ───────────────────────────────────────
    // FILA 5: Título del reporte
    // ───────────────────────────────────────
    sheet.getRow(5).height = 28;
    sheet.mergeCells(`A5:${lastColLetter}5`);
    const titleCell = sheet.getCell('A5');
    titleCell.value = titulo.toUpperCase();
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: BRAND.primary } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    titleCell.border = { bottom: { style: 'medium', color: { argb: BRAND.primary } } };

    // ───────────────────────────────────────
    // FILA 6: Metadata (fecha, total registros)
    // ───────────────────────────────────────
    sheet.mergeCells(`A6:C6`);
    const dateCell = sheet.getCell('A6');
    dateCell.value = `Generado: ${new Date().toLocaleString()}`;
    dateCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: BRAND.textMid } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    if (numCols > 3) {
        const mergeEnd = lastColLetter;
        sheet.mergeCells(`D6:${mergeEnd}6`);
        const countCell = sheet.getCell('D6');
        countCell.value = `Total registros: ${datos.length}`;
        countCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BRAND.secondary } };
        countCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    }

    // ───────────────────────────────────────
    // FILA 7: Separador
    // ───────────────────────────────────────
    sheet.getRow(7).height = 8;

    // ───────────────────────────────────────
    // FILA 8: Cabecera de la tabla
    // ───────────────────────────────────────
    const DATA_START_ROW = 8;

    if (!datos || datos.length === 0) {
        sheet.mergeCells(`A${DATA_START_ROW}:${lastColLetter}${DATA_START_ROW}`);
        const emptyCell = sheet.getCell(`A${DATA_START_ROW}`);
        emptyCell.value = 'No hay datos disponibles para este reporte.';
        emptyCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: BRAND.textLight } };
        emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
        // Configurar columnas
        sheet.columns = columnKeys.map(key => ({
            key,
            width: Math.max(18, humanize(key).length + 6)
        }));

        // Header row
        const headerRow = sheet.getRow(DATA_START_ROW);
        headerRow.height = 28;
        columnKeys.forEach((key, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = humanize(key).toUpperCase();
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BRAND.white } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: BRAND.primary } },
                bottom: { style: 'thin', color: { argb: BRAND.primary } },
                left: { style: 'hair', color: { argb: 'FF34495E' } },
                right: { style: 'hair', color: { argb: 'FF34495E' } },
            };
        });

        // Filas de datos con zebra stripes
        datos.forEach((item, idx) => {
            const rowData: any = {};
            columnKeys.forEach(key => {
                const val = item[key];
                if (val === null || val === undefined) { rowData[key] = '—'; return; }
                if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                    rowData[key] = new Date(val).toLocaleDateString();
                    return;
                }
                rowData[key] = val;
            });

            const row = sheet.addRow(rowData);
            const isZebra = idx % 2 === 0;

            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { name: 'Arial', size: 9, color: { argb: BRAND.textDark } };
                cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                cell.border = {
                    bottom: { style: 'hair', color: { argb: BRAND.lineSoft } },
                };
                if (isZebra) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.bgZebra } };
                }
            });
        });

        // Línea inferior fuerte al final de la tabla
        const lastDataRow = sheet.lastRow;
        if (lastDataRow) {
            lastDataRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    ...cell.border,
                    bottom: { style: 'thin', color: { argb: BRAND.primary } },
                };
            });
        }

        // Auto-filtro
        sheet.autoFilter = {
            from: { row: DATA_START_ROW, column: 1 },
            to: { row: DATA_START_ROW + datos.length, column: columnKeys.length }
        };

        // Congelar filas superiores
        sheet.views = [{ state: 'frozen', ySplit: DATA_START_ROW, showGridLines: false }];
    }

    // ───────────────────────────────────────
    // FOOTER: Fila final con nota
    // ───────────────────────────────────────
    sheet.addRow([]);
    const footerRow = sheet.addRow([]);
    const footerCellRef = `A${footerRow.number}`;
    sheet.mergeCells(`${footerCellRef}:${lastColLetter}${footerRow.number}`);
    const footerCell = sheet.getCell(footerCellRef);
    footerCell.value = `EasyDiesel © ${new Date().getFullYear()} — Documento confidencial, generado automáticamente.`;
    footerCell.font = { name: 'Arial', size: 7, italic: true, color: { argb: BRAND.textLight } };
    footerCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

// ═══════════════════════════════════════════════
//  GENERADOR CSV — Datos planos sin estilos
// ═══════════════════════════════════════════════

export const generarCSV = async (titulo: string, datos: any[]): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    if (datos && datos.length > 0) {
        const sampleItem = datos[0];
        const columns = Object.keys(sampleItem)
            .filter(key => typeof sampleItem[key] !== 'object')
            .map(key => ({ header: humanize(key), key: key }));

        sheet.columns = columns;

        datos.forEach(item => {
            const rowData: any = {};
            columns.forEach(col => {
                if (col.key) rowData[col.key] = item[col.key];
            });
            sheet.addRow(rowData);
        });
    } else {
        sheet.getCell('A1').value = 'No hay datos disponibles para este reporte.';
    }

    const buffer = await workbook.csv.writeBuffer();
    return Buffer.from(buffer);
};
