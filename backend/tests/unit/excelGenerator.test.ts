import { generarExcel, generarCSV } from '../../src/utils/excelGenerator';

describe('Excel Generator Util', () => {
    describe('generarExcel', () => {
        it('deberia generar un Excel con datos', async () => {
            const datos = [
                { id: '1', nombre: 'Test 1', cantidad: 100, activo: true, fecha: new Date('2026-01-01') },
                { id: '2', nombre: 'Test 2', cantidad: 200, activo: false, fecha: '2026-01-02T10:00:00Z' },
                { id: '3', nombre: 'Test 3', nulo: null, vacio: undefined }
            ];
            const buffer = await generarExcel('Reporte de Prueba Excel', datos);
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('deberia generar un Excel sin datos', async () => {
            const buffer = await generarExcel('Reporte Vacío Excel', []);
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
        });
    });

    describe('generarCSV', () => {
        it('deberia generar un CSV con datos', async () => {
            const datos = [
                { id: '1', nombre: 'Test 1', cantidad: 100 },
                { id: '2', nombre: 'Test 2', cantidad: 200 }
            ];
            const buffer = await generarCSV('Reporte Prueba CSV', datos);
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);

            const csvText = buffer.toString('utf-8');
            expect(csvText).toContain('Test 1');
            expect(csvText).toContain('100');
        });

        it('deberia generar un CSV sin datos', async () => {
            const buffer = await generarCSV('Reporte Vacío CSV', []);
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);

            const csvText = buffer.toString('utf-8');
            expect(csvText).toContain('No hay datos disponibles para este reporte');
        });
    });
});
