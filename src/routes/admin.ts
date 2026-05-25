import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { AdminEscolasService } from "../services/AdminEscolasService";
import { AdminCheckInService } from "../services/AdminCheckInService";
import { ResumoService } from "../modules/resumo/resumo.service";
import { adminAuth } from "../middlewares/adminAuth";
import { checkInAuth } from "../middlewares/checkInAuth";

const checkInParticipantesSchema = {
  querystring: {
    type: "object",
    required: ["nome"],
    properties: {
      nome: { type: "string", minLength: 2 },
      limite: { type: "integer", minimum: 1, maximum: 50 },
      checkIn: { enum: ["TODOS", "FEITO", "PENDENTE"] },
      escolaId: { type: "string", format: "uuid" },
    },
  },
};

const checkInParticipanteParamsSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};

export async function adminRoutes(app: FastifyInstance) {
  const prisma = new PrismaClient();

  app.get("/admin/escolas", { preHandler: adminAuth }, async () => {
    const service = new AdminEscolasService(prisma);
    return service.listar();
  });

  app.get(
    "/admin/check-in/participantes",
    { preHandler: adminAuth, schema: checkInParticipantesSchema },
    async (request) => {
      const { nome, limite } = request.query as {
        nome: string;
        limite?: number;
      };
      const service = new AdminCheckInService(prisma);

      return service.buscarParticipantes({ nome, limite });
    },
  );

  app.get(
    "/check-in/participantes",
    { preHandler: checkInAuth, schema: checkInParticipantesSchema },
    async (request) => {
      const { nome, limite, checkIn, escolaId } = request.query as {
        nome: string;
        limite?: number;
        checkIn?: "TODOS" | "FEITO" | "PENDENTE";
        escolaId?: string;
      };
      const service = new AdminCheckInService(prisma);

      return service.buscarParticipantes({ nome, limite, checkIn, escolaId });
    },
  );

  app.get("/check-in/escolas", { preHandler: checkInAuth }, async () => {
    const service = new AdminCheckInService(prisma);
    return service.listarEscolas();
  });

  app.patch(
    "/check-in/participantes/:id/check-in",
    { preHandler: checkInAuth, schema: checkInParticipanteParamsSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const service = new AdminCheckInService(prisma);

      try {
        return await service.fazerCheckIn(id);
      } catch (error: any) {
        if (error.message === "PARTICIPANTE_NAO_ENCONTRADO") {
          reply.code(404).send({ message: "Participante não encontrado" });
          return;
        }

        throw error;
      }
    },
  );

  app.get("/admin/escolas/:id", { preHandler: adminAuth }, async (request) => {
    const { id } = request.params as { id: string };
    const resumoService = new ResumoService(app.prisma);
    try {
      return await resumoService.gerar(id);
    } catch (error: any) {
      if (error.message !== "ESCOLA_NAO_ENCONTRADA") {
        throw error;
      }
    }

    return resumoService.gerarIndependente(id);
  });

  app.delete(
    "/admin/escolas/:id",
    { preHandler: adminAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const service = new AdminEscolasService(prisma);

      try {
        await service.excluirInscricao(id);
      } catch (error: any) {
        if (error.message === "INSCRICAO_NAO_ENCONTRADA") {
          reply.code(404).send({ message: "Inscrição não encontrada" });
          return;
        }

        throw error;
      }

      reply.code(204).send();
    },
  );
}
