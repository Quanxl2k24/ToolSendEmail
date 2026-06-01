import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Tool Send Email API",
            version: "2.0.0",
            description: "API Documentation - Domain Driven Design Architecture\n\nAuthentication: All `/api/campaigns` routes require a Google OAuth2 Bearer token in the Authorization header.",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "Google OAuth2 Access Token",
                    description: "Paste your Google OAuth2 access_token here (obtained from Google Sign-In on the frontend).",
                },
            },
        },
    },
    // Scan all module route/controller files for @openapi annotations
    apis: [
        "./src/modules/campaigns/*.ts",
        "./src/modules/mail/*.ts",
    ],
};
const swaggerSpec = swaggerJsdoc(options);
export const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
//# sourceMappingURL=swagger.js.map