import { FastifyInstance } from "fastify";
import { BailarinoService } from "./bailarino.service";

export async function criarBailarinoController(
  app: FastifyInstance,
  request: any,
  reply: any,
) {
  try {
    const service = new BailarinoService(app.prisma);

    const bailarino = await service.criarPorEscola({
      escolaId: request.params.id,
      ...request.body,
    });

    reply.code(201).send({ id: bailarino.id });
  } catch (error: any) {
    if (error.message === "ESCOLA_NAO_ENCONTRADA") {
      reply.code(404).send({ message: "Escola não encontrada" });
      return;
    }

    throw error;
  }
}

export async function criarBailarinoIndependenteController(
  app: FastifyInstance,
  request: any,
  reply: any,
) {
  try {
    const service = new BailarinoService(app.prisma);

    const bailarino = await service.criarPorIndependente({
      independenteId: request.params.id,
      ...request.body,
    });

    reply.code(201).send({ id: bailarino.id });
  } catch (error: any) {
    if (error.message === "INDEPENDENTE_NAO_ENCONTRADO") {
      reply.code(404).send({ message: "Inscrição independente não encontrada" });
      return;
    }

    throw error;
  }
}

export async function listarBailarinosController(
  app: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const service = new BailarinoService(app.prisma);

    const bailarinos = await service.listarPorEscola(request.params.id);

    reply.send(bailarinos);
  } catch (error: any) {
    if (error.message === "ESCOLA_NAO_ENCONTRADA") {
      reply.code(404).send({ message: "Escola não encontrada" });
      return;
    }

    throw error;
  }
}

export async function listarBailarinosIndependenteController(
  app: FastifyInstance,
  request: any,
  reply: any,
) {
  try {
    const service = new BailarinoService(app.prisma);

    const bailarinos = await service.listarPorIndependente(request.params.id);

    reply.send(bailarinos);
  } catch (error: any) {
    if (error.message === "INDEPENDENTE_NAO_ENCONTRADO") {
      reply.code(404).send({ message: "Inscrição independente não encontrada" });
      return;
    }

    throw error;
  }
}
