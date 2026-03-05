import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Metadatos de la API
const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EasyDiesel API',
            version: '1.0.0',
            description: 'Documentación de la API de EasyDiesel (Decreto 1428/2025)',
            contact: {
                name: 'Soporte EasyDiesel',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Introduce el token JWT usando el schema Bearer',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Buscar JSDoc en todos los archivos de rutas
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'EasyDiesel API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
    }));
};
