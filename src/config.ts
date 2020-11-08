export default {
  swagger: {
    definition: {
      openapi: "3.0.0",
      info: {
        title: 'TEMP Stack',
        version: '0.0.0',
      },
      components: {
        securitySchemes: {
          jwt: {
            type: "http",
            scheme: "bearer",
            in: "header",
            bearerFormat: "JWT"
          },
        }
      }
    },
  },
  mongo: {
      url: 'mongodb://localhost/test'
  },
  port: '3000'
};
