import fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { env } from "@/env";

export const app = fastify().withTypeProvider<ZodTypeProvider>();
app.register(cors);

// set jwt config
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

// api documentation config
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Api SaaS",
      description: "Api for a saas app",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});
app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
