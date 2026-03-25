import { Options } from 'swagger-jsdoc'
import config from './config'

export const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express TS Starter Kit API',
            version: '1.0.0',
            description:
                'API documentation for the Express TypeScript Starter Kit',
        },
        servers: [
            {
                url: config.server.url + '/api/v1',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/features/**/*.route.ts', './src/features/**/*.types.ts'], // Path to the API docs
}
