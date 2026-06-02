import { Options } from 'swagger-jsdoc'
import config from './config'

export const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BK Volunteers API',
            version: '1.0.0',
            description: 'Spec-first API documentation for BK Volunteers pilot',
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
            schemas: {
                ApiResponseSuccess: {
                    type: 'object',
                    required: ['success', 'message', 'data'],
                    properties: {
                        success: {
                            type: 'boolean',
                            enum: [true],
                        },
                        message: {
                            type: 'string',
                            example: 'Success',
                        },
                        data: {},
                    },
                },
                ApiResponseError: {
                    type: 'object',
                    required: ['success', 'message', 'errors'],
                    properties: {
                        success: {
                            type: 'boolean',
                            enum: [false],
                        },
                        message: {
                            type: 'string',
                            example: 'Validation error',
                        },
                        errors: {
                            nullable: true,
                        },
                        stack: {
                            type: 'string',
                        },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    required: ['total', 'page', 'limit', 'totalPages'],
                    properties: {
                        total: {
                            type: 'integer',
                            example: 42,
                        },
                        page: {
                            type: 'integer',
                            example: 1,
                        },
                        limit: {
                            type: 'integer',
                            example: 20,
                        },
                        totalPages: {
                            type: 'integer',
                            example: 3,
                        },
                    },
                },
                UnauthorizedError: {
                    allOf: [
                        { $ref: '#/components/schemas/ApiResponseError' },
                        {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'Unauthorized',
                                },
                            },
                        },
                    ],
                },
                ForbiddenError: {
                    allOf: [
                        { $ref: '#/components/schemas/ApiResponseError' },
                        {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example:
                                        'You do not have permission to perform this action',
                                },
                            },
                        },
                    ],
                },
                NotFoundError: {
                    allOf: [
                        { $ref: '#/components/schemas/ApiResponseError' },
                        {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'Resource not found',
                                },
                            },
                        },
                    ],
                },
                ValidationError: {
                    allOf: [
                        { $ref: '#/components/schemas/ApiResponseError' },
                        {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'Validation error',
                                },
                            },
                        },
                    ],
                },
                StateConflictError: {
                    allOf: [
                        { $ref: '#/components/schemas/ApiResponseError' },
                        {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'State conflict',
                                },
                            },
                        },
                    ],
                },
            },
        },
    },
    apis: ['./src/features/**/*.route.ts'],
}
