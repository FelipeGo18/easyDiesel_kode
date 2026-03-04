import request from 'supertest';
import { app } from '../../src/app';

describe('Health Check', () => {
    it('GET /api/health debería retornar status ok', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('environment');
    });
});
