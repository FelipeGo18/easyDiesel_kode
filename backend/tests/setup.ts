
import { execSync } from 'child_process';

beforeAll(() => {
    // Solo ejecutar migraciones si no estamos en pruebas unitarias
    if (process.env.TEST_TYPE !== 'unit') {
        try {
            execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });
        } catch (error) {
            console.warn('Advertencia: No se pudieron ejecutar las migraciones. Ignorando para pruebas unitarias.');
        }
    }
});
