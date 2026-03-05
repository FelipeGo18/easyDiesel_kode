
import { execSync } from 'child_process';

beforeAll(() => {
    execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });
});
