import { generarPDF } from '../../src/utils/pdfGenerator';

describe('PDF Generator Util', () => {
    it('deberia generar un PDF con datos', async () => {
        const datos = [
            { id: '1', nombre: 'Test 1', cantidad: 100, activo: true, fecha: new Date('2026-01-01') },
            { id: '2', nombre: 'Test 2', cantidad: 200, activo: false, fecha: '2026-01-02T10:00:00Z' },
        ];
        const buffer = await generarPDF('Reporte de Prueba', datos);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
    });

    it('deberia generar un PDF sin datos', async () => {
        const buffer = await generarPDF('Reporte Vacío', []);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
    });

    it('deberia generar un PDF con muchos datos (paginacion)', async () => {
        const datos = Array.from({ length: 150 }, (_, i) => ({
            id: String(i),
            fila: `Fila ${i}`,
            valor: Math.random() * 1000,
        }));
        const buffer = await generarPDF('Reporte Largo', datos);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
    });
});
