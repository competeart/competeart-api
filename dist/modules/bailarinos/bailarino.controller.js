"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarBailarinoController = criarBailarinoController;
exports.criarBailarinoIndependenteController = criarBailarinoIndependenteController;
exports.listarBailarinosController = listarBailarinosController;
exports.listarBailarinosIndependenteController = listarBailarinosIndependenteController;
const bailarino_service_1 = require("./bailarino.service");
async function criarBailarinoController(app, request, reply) {
    try {
        const service = new bailarino_service_1.BailarinoService(app.prisma);
        const bailarino = await service.criarPorEscola({
            escolaId: request.params.id,
            ...request.body,
        });
        reply.code(201).send({ id: bailarino.id });
    }
    catch (error) {
        if (error.message === "ESCOLA_NAO_ENCONTRADA") {
            reply.code(404).send({ message: "Escola não encontrada" });
            return;
        }
        throw error;
    }
}
async function criarBailarinoIndependenteController(app, request, reply) {
    try {
        const service = new bailarino_service_1.BailarinoService(app.prisma);
        const bailarino = await service.criarPorIndependente({
            independenteId: request.params.id,
            ...request.body,
        });
        reply.code(201).send({ id: bailarino.id });
    }
    catch (error) {
        if (error.message === "INDEPENDENTE_NAO_ENCONTRADO") {
            reply.code(404).send({ message: "Inscrição independente não encontrada" });
            return;
        }
        throw error;
    }
}
async function listarBailarinosController(app, request, reply) {
    try {
        const service = new bailarino_service_1.BailarinoService(app.prisma);
        const bailarinos = await service.listarPorEscola(request.params.id);
        reply.send(bailarinos);
    }
    catch (error) {
        if (error.message === "ESCOLA_NAO_ENCONTRADA") {
            reply.code(404).send({ message: "Escola não encontrada" });
            return;
        }
        throw error;
    }
}
async function listarBailarinosIndependenteController(app, request, reply) {
    try {
        const service = new bailarino_service_1.BailarinoService(app.prisma);
        const bailarinos = await service.listarPorIndependente(request.params.id);
        reply.send(bailarinos);
    }
    catch (error) {
        if (error.message === "INDEPENDENTE_NAO_ENCONTRADO") {
            reply.code(404).send({ message: "Inscrição independente não encontrada" });
            return;
        }
        throw error;
    }
}
