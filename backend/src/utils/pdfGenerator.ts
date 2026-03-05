import PDFDocument from 'pdfkit';

export const generarPDF = async (titulo: string, datos: any[]): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Titulo
            doc.fontSize(20).text(`Reporte: ${titulo}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.moveDown(2);

            // Tabla simple de datos
            if (!datos || datos.length === 0) {
                doc.fontSize(12).text('No hay datos disponibles para este reporte.');
            } else {
                // Iterar sobre los datos y mostrarlos como lista
                datos.forEach((item, index) => {
                    doc.fontSize(12).font('Helvetica-Bold').text(`Registro #${index + 1}`);
                    doc.font('Helvetica').fontSize(10);

                    Object.entries(item).forEach(([key, value]) => {
                        if (typeof value !== 'object') {
                            doc.text(`${key}: ${value}`);
                        }
                    });
                    doc.moveDown();
                });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
