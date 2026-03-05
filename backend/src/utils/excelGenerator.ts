import ExcelJS from 'exceljs';

export const generarExcel = async (titulo: string, datos: any[]): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyDiesel';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte');

    if (datos && datos.length > 0) {
        // Extraer las keys del primer objeto (asumiendo formato uniforme y omitiendo sub-objetos anidados complejos)
        const sampleItem = datos[0];
        const columns = Object.keys(sampleItem)
            .filter(key => typeof sampleItem[key] !== 'object')
            .map(key => ({
                header: key.toUpperCase(),
                key: key,
                width: 20
            }));

        sheet.columns = columns;

        // Agregar formato a la cabecera
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Agregar datos
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

    // cast a Buffer ya que exceljs retorna un Uint8Array|ArrayBuffer en memory
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
