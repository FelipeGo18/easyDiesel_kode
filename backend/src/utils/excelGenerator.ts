import ExcelJS from 'exceljs';

export const generarExcel = async (titulo: string, datos: any[]): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyDiesel';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte', {
        views: [{ showGridLines: false }] // Minimalista: Ocultar líneas de cuadrícula por defecto
    });

    // 1. Cabecera principal (Título Empresarial)
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Reporte: ${titulo}`;
    titleCell.font = { name: 'Arial', family: 2, size: 16, bold: true, color: { argb: 'FF2C3E50' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

    // 2. Subtítulo (Fecha de generación)
    sheet.mergeCells('A2:F2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Generado el: ${new Date().toLocaleString()}`;
    subtitleCell.font = { name: 'Arial', family: 2, size: 10, italic: true, color: { argb: 'FF7F8C8D' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Espacio en blanco
    sheet.addRow([]);

    if (datos && datos.length > 0) {
        const sampleItem = datos[0];

        // Evitar objetos anidados y fechas complejas, simplificar columnas
        const columnKeys = Object.keys(sampleItem).filter(key => typeof sampleItem[key] !== 'object' && key !== 'id');

        const columns = columnKeys.map(key => ({
            header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Formato capitalizado
            key: key,
            width: 25
        }));

        sheet.columns = columns;

        // Fila de encabezados de la tabla
        const headerRow = sheet.getRow(4);
        headerRow.values = columns.map(c => c.header);
        headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2C3E50' } // Azul oscuro corporativo
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Bordes sutiles para la cabecera
        headerRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
                bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
                left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
                right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
            };
        });

        // Filas de datos
        datos.forEach((item, index) => {
            const rowData: any = {};
            columns.forEach(col => {
                if (col.key) rowData[col.key] = item[col.key];
            });
            const row = sheet.addRow(rowData);
            row.font = { name: 'Arial', size: 10, color: { argb: 'FF34495E' } };
            row.alignment = { vertical: 'middle', horizontal: 'left' };

            // Bordes horizontales sutiles para filas de datos
            row.eachCell(cell => {
                cell.border = {
                    bottom: { style: 'hair', color: { argb: 'FFECF0F1' } }
                };
            });
        });
    } else {
        const emptyCell = sheet.getCell('A4');
        emptyCell.value = 'No hay datos disponibles para este reporte.';
        emptyCell.font = { name: 'Arial', italic: true, color: { argb: 'FF95A5A6' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

export const generarCSV = async (titulo: string, datos: any[]): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    if (datos && datos.length > 0) {
        const sampleItem = datos[0];
        const columns = Object.keys(sampleItem)
            .filter(key => typeof sampleItem[key] !== 'object')
            .map(key => ({ header: key.toUpperCase(), key: key }));

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
