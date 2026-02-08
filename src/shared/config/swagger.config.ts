/**
 * Swagger/OpenAPI Configuration
 * Centralized configuration for API documentation
 */

import { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Modular Monolith API",
      version: "1.0.0",
      description:
        "A modular monolith API built with Express, TypeScript, and Clean Architecture principles. This API provides authentication, user management, and organization management features.",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "http://localhost:8001",
        description: "Test server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token",
        },
      },
      schemas: {
        // Standard Success Response
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            code: {
              type: "string",
              example: "SUCCESS",
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
              description: "Response data (varies by endpoint)",
            },
          },
          required: ["success", "code", "message", "data"],
        },
        // Standard Error Response
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            code: {
              type: "string",
              example: "ERROR_DEFAULT",
            },
            message: {
              type: "string",
              example: "An error occurred",
            },
            errors: {
              type: "object",
              nullable: true,
              description: "Additional error details",
            },
          },
          required: ["success", "code", "message"],
        },
        // Validation Error Response
        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            code: {
              type: "string",
              example: "ERROR_VALIDATION",
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      parameters: {
        // Authorization header parameter
        Authorization: {
          name: "Authorization",
          in: "header",
          description: "Bearer token for authentication",
          required: true,
          schema: {
            type: "string",
            example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      responses: {
        // Common responses
        UnauthorizedError: {
          description: "Unauthorized - Invalid or missing token",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                code: "AUTH_UNAUTHORIZED",
                message: "Unauthorized access",
                errors: null,
              },
            },
          },
        },
        ValidationError: {
          description: "Validation Error - Invalid request data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationErrorResponse",
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                code: "ERROR_DEFAULT",
                message: "Internal server error",
                errors: null,
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Organizations",
        description: "Organization management endpoints",
      },
    ],
  },
  // Path to the API docs (will be imported in app.ts)
  apis: [
    "./src/modules/*/interface/*.swagger.ts",
    "./src/modules/*/interface/*.routes.ts",
  ],
};
