const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0", // OpenAPI version
    info: {
      title: "RadioIQ",
      version: "1.0.0",
      description: "API documentation for RadioIQ",
    },
    servers: [
      {
        url: process.env.API_BASE_URL,
      },
    ],
  },
  apis: ["./Routes/*.js"], // Path to your route files containing Swagger comments
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
module.exports = swaggerDocs;
