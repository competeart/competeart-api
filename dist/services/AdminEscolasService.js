"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEscolasService = void 0;
const lotes_1 = require("../lib/lotes");
class AdminEscolasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    calcularStatusPorEtapas(possuiElenco, quantidadeCoreografias, limiteCoreografias) {
        if (!possuiElenco)
            return "FALTA_ELENCO";
        if (quantidadeCoreografias < limiteCoreografias)
            return "FALTA_COREOGRAFIA";
        return "COMPLETO";
    }
    calcularValorCoreografias(coreografias) {
        let valorCoreografias = 0;
        coreografias.forEach((c) => {
            valorCoreografias += (0, lotes_1.calcularValorCoreografia)(c.formacao, c.bailarinos.length);
        });
        return valorCoreografias;
    }
    async listar() {
        const [escolas, independentes] = await Promise.all([
            this.prisma.escola.findMany({
                include: {
                    profissionais: true,
                    bailarinos: true,
                    coreografias: {
                        include: {
                            bailarinos: true,
                        },
                    },
                },
            }),
            this.prisma.inscricaoIndependente.findMany({
                include: {
                    bailarinos: true,
                    coreografias: {
                        include: {
                            bailarinos: true,
                        },
                    },
                },
            }),
        ]);
        const inscricoesEscola = escolas.map((escola) => {
            const profissionaisExtras = Math.max(0, escola.profissionais.length - 2);
            const valorProfissionaisExtras = profissionaisExtras * 70;
            const valorCoreografias = this.calcularValorCoreografias(escola.coreografias);
            const total = valorCoreografias + valorProfissionaisExtras;
            const status = this.calcularStatusPorEtapas(escola.bailarinos.length > 0, escola.coreografias.length, escola.limiteCoreografias);
            return {
                id: escola.id,
                nome: escola.nome,
                whatsapp: escola.whatsapp,
                dataInscricao: escola.criadoEm,
                limiteCoreografias: escola.limiteCoreografias,
                bailarinosCadastrados: escola.bailarinos.length,
                coreografiasCadastradas: escola.coreografias.length,
                valorTotal: total,
                tipoInscricao: "ESCOLA",
                status,
            };
        });
        const inscricoesIndependentes = independentes.map((independente) => {
            const valorCoreografias = this.calcularValorCoreografias(independente.coreografias);
            const status = this.calcularStatusPorEtapas(independente.bailarinos.length > 0, independente.coreografias.length, independente.limiteCoreografias);
            return {
                id: independente.id,
                nome: independente.nomeResponsavel,
                whatsapp: independente.whatsapp,
                dataInscricao: independente.criadoEm,
                limiteCoreografias: independente.limiteCoreografias,
                bailarinosCadastrados: independente.bailarinos.length,
                coreografiasCadastradas: independente.coreografias.length,
                valorTotal: valorCoreografias,
                tipoInscricao: "BAILARINO_INDEPENDENTE",
                status,
            };
        });
        return [...inscricoesEscola, ...inscricoesIndependentes];
    }
    async excluirInscricao(id) {
        const [escola, independente] = await Promise.all([
            this.prisma.escola.findUnique({ where: { id }, select: { id: true } }),
            this.prisma.inscricaoIndependente.findUnique({
                where: { id },
                select: { id: true },
            }),
        ]);
        if (!escola && !independente) {
            throw new Error("INSCRICAO_NAO_ENCONTRADA");
        }
        await this.prisma.$transaction(async (tx) => {
            if (escola) {
                const coreografiasEscola = await tx.coreografia.findMany({
                    where: { escolaId: id },
                    select: { id: true },
                });
                const coreografiaIds = coreografiasEscola.map((item) => item.id);
                await tx.coreografiaBailarino.deleteMany({
                    where: { coreografiaId: { in: coreografiaIds } },
                });
                await tx.coreografia.deleteMany({
                    where: { escolaId: id },
                });
                await tx.bailarino.deleteMany({
                    where: { escolaId: id },
                });
                await tx.profissional.deleteMany({
                    where: { escolaId: id },
                });
                await tx.escola.delete({
                    where: { id },
                });
                return;
            }
            const coreografiasIndependente = await tx.coreografia.findMany({
                where: { independenteId: id },
                select: { id: true },
            });
            const coreografiaIds = coreografiasIndependente.map((item) => item.id);
            await tx.coreografiaBailarino.deleteMany({
                where: { coreografiaId: { in: coreografiaIds } },
            });
            await tx.coreografia.deleteMany({
                where: { independenteId: id },
            });
            await tx.bailarino.deleteMany({
                where: { independenteId: id },
            });
            await tx.inscricaoIndependente.delete({
                where: { id },
            });
        });
    }
}
exports.AdminEscolasService = AdminEscolasService;
