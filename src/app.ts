import Fastify from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma";
import { escolaRoutes } from "./modules/escolas/escola.routes";
import { bailarinoRoutes } from "./modules/bailarinos/bailarino.routes";
import { coreografiaRoutes } from "./modules/coreografias/coreografia.routes";
import { resumoRoutes } from "./modules/resumo/resumo.routes";
import { adminRoutes } from "./routes/admin";
import { cronogramaRoutes } from "./routes/cronograma";
import { independenteRoutes } from "./modules/independentes/independente.routes";

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors, {
    origin: [
      "http://localhost:5173",
      "https://competeart-web.vercel.app",
      "https://competeartfestival.com.br",
      "https://www.competeartfestival.com.br",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key", "x-checkin-key"],
  });

  app.register(prismaPlugin);

  app.register(escolaRoutes);
  app.register(bailarinoRoutes);
  app.register(coreografiaRoutes);
  app.register(resumoRoutes);
  app.register(independenteRoutes);

  app.register(adminRoutes);
  app.register(cronogramaRoutes);
  app.get("/", async () => {
    return { status: "ok" };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
