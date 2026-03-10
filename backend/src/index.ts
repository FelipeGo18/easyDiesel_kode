import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { app } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
    console.log(`🛢️  Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋  Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍  Entorno: ${process.env.NODE_ENV || 'development'}`);
});
