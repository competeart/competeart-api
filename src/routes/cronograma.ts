import { FastifyInstance } from "fastify";
import { adminAuth } from "../middlewares/adminAuth";
import { CronogramaService } from "../services/CronogramaService";

const reordenarCronogramaSchema = {
  body: {
    type: "object",
    required: ["coreografiasIds"],
    properties: {
      coreografiasIds: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 1 },
      },
    },
  },
};

const marcarConclusaoCronogramaSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
  body: {
    type: "object",
    required: ["concluida"],
    properties: {
      concluida: { type: "boolean" },
    },
  },
};

export async function cronogramaRoutes(app: FastifyInstance) {
  const service = new CronogramaService();

  app.get("/cronograma", async () => {
    return service.listar();
  });

  app.put(
    "/cronograma/ordem",
    { preHandler: adminAuth, schema: reordenarCronogramaSchema },
    async (request, reply) => {
      const { coreografiasIds } = request.body as { coreografiasIds: string[] };

      try {
        return await service.reordenar(coreografiasIds);
      } catch (error: any) {
        if (error.message === "COREOGRAFIA_INVALIDA") {
          reply.code(400).send({ message: "Lista de coreografias inválida" });
          return;
        }

        throw error;
      }
    },
  );

  app.patch(
    "/cronograma/:id/conclusao",
    { preHandler: adminAuth, schema: marcarConclusaoCronogramaSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { concluida } = request.body as { concluida: boolean };

      try {
        return await service.marcarConclusao(id, concluida);
      } catch (error: any) {
        if (error.message === "COREOGRAFIA_NAO_ENCONTRADA") {
          reply.code(404).send({ message: "Coreografia não encontrada" });
          return;
        }

        throw error;
      }
    },
  );
}
