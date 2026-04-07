"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BailarinoService = void 0;
class BailarinoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async criarPorEscola(data) {
        const escola = await this.prisma.escola.findUnique({
            where: { id: data.escolaId },
        });
        if (!escola) {
            throw new Error("ESCOLA_NAO_ENCONTRADA");
        }
        return this.prisma.bailarino.create({
            data: {
                nomeCompleto: data.nomeCompleto,
                nomeArtistico: data.nomeArtistico,
                tipoDocumento: data.tipoDocumento,
                documento: data.documento,
                dataNascimento: new Date(data.dataNascimento),
                escolaId: data.escolaId,
                independenteId: null,
            },
        });
    }
    async criarPorIndependente(data) {
        const independente = await this.prisma.inscricaoIndependente.findUnique({
            where: { id: data.independenteId },
        });
        if (!independente) {
            throw new Error("INDEPENDENTE_NAO_ENCONTRADO");
        }
        return this.prisma.bailarino.create({
            data: {
                nomeCompleto: data.nomeCompleto,
                nomeArtistico: data.nomeArtistico,
                tipoDocumento: data.tipoDocumento,
                documento: data.documento,
                dataNascimento: new Date(data.dataNascimento),
                escolaId: null,
                independenteId: data.independenteId,
            },
        });
    }
    async criar(data) {
        if (data.escolaId) {
            return this.criarPorEscola({ ...data, escolaId: data.escolaId });
        }
        if (data.independenteId) {
            return this.criarPorIndependente({
                ...data,
                independenteId: data.independenteId,
            });
        }
        throw new Error("INSCRICAO_INVALIDA");
    }
    async listarPorEscola(escolaId) {
        const escola = await this.prisma.escola.findUnique({
            where: { id: escolaId },
        });
        if (!escola) {
            throw new Error("ESCOLA_NAO_ENCONTRADA");
        }
        return this.prisma.bailarino.findMany({
            where: { escolaId },
            orderBy: { nomeArtistico: "asc" },
        });
    }
    async listarPorIndependente(independenteId) {
        const independente = await this.prisma.inscricaoIndependente.findUnique({
            where: { id: independenteId },
        });
        if (!independente) {
            throw new Error("INDEPENDENTE_NAO_ENCONTRADO");
        }
        return this.prisma.bailarino.findMany({
            where: { independenteId },
            orderBy: { nomeArtistico: "asc" },
        });
    }
}
exports.BailarinoService = BailarinoService;
