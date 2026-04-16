"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumoService = void 0;
const lotes_1 = require("../../lib/lotes");
class ResumoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async gerar(escolaId) {
        const escola = await this.prisma.escola.findUnique({
            where: { id: escolaId },
            include: {
                profissionais: true,
                coreografias: {
                    include: {
                        bailarinos: {
                            include: {
                                bailarino: true,
                            },
                        },
                    },
                },
            },
        });
        if (!escola) {
            throw new Error("ESCOLA_NAO_ENCONTRADA");
        }
        const profissionaisExtras = Math.max(0, escola.profissionais.length - 2);
        const valorProfissionaisExtras = profissionaisExtras * 70;
        let valorCoreografias = 0;
        const coreografiasDetalhe = escola.coreografias.map((c) => {
            const valor = (0, lotes_1.calcularValorCoreografia)(c.formacao, c.bailarinos.length);
            valorCoreografias += valor;
            return {
                id: c.id,
                nome: c.nome,
                nomeCoreografo: c.nomeCoreografo,
                formacao: c.formacao,
                modalidade: c.modalidade,
                categoria: c.categoria,
                duracao: c.duracao,
                musica: c.musica,
                temCenario: c.temCenario,
                bailarinos: c.bailarinos.length,
                listaBailarinos: c.bailarinos.map((item) => ({
                    id: item.bailarino.id,
                    nomeCompleto: item.bailarino.nomeCompleto,
                    nomeArtistico: item.bailarino.nomeArtistico,
                })),
                valor,
            };
        });
        return {
            escola: {
                id: escola.id,
                nome: escola.nome,
                email: escola.email,
                limiteCoreografias: escola.limiteCoreografias,
                whatsapp: escola.whatsapp,
                nomeDiretor: escola.nomeDiretor,
                endereco: escola.endereco,
                profissionais: escola.profissionais.map((profissional) => ({
                    id: profissional.id,
                    nome: profissional.nome,
                    funcao: profissional.funcao,
                    ehExtra: profissional.ehExtra,
                })),
            },
            totais: {
                coreografias: escola.coreografias.length,
                assistentesExtras: profissionaisExtras,
                profissionaisExtras,
            },
            valores: {
                coreografias: valorCoreografias,
                assistentesExtras: valorProfissionaisExtras,
                profissionaisExtras: valorProfissionaisExtras,
                total: valorCoreografias + valorProfissionaisExtras,
            },
            detalhamento: {
                coreografias: coreografiasDetalhe,
            },
        };
    }
    async gerarIndependente(independenteId) {
        const inscricao = await this.prisma.inscricaoIndependente.findUnique({
            where: { id: independenteId },
            include: {
                coreografias: {
                    include: {
                        bailarinos: {
                            include: {
                                bailarino: true,
                            },
                        },
                    },
                },
            },
        });
        if (!inscricao) {
            throw new Error("INDEPENDENTE_NAO_ENCONTRADO");
        }
        let valorCoreografias = 0;
        const coreografiasDetalhe = inscricao.coreografias.map((c) => {
            const valor = (0, lotes_1.calcularValorCoreografia)(c.formacao, c.bailarinos.length);
            valorCoreografias += valor;
            return {
                id: c.id,
                nome: c.nome,
                nomeCoreografo: c.nomeCoreografo,
                formacao: c.formacao,
                modalidade: c.modalidade,
                categoria: c.categoria,
                duracao: c.duracao,
                musica: c.musica,
                temCenario: c.temCenario,
                bailarinos: c.bailarinos.length,
                listaBailarinos: c.bailarinos.map((item) => ({
                    id: item.bailarino.id,
                    nomeCompleto: item.bailarino.nomeCompleto,
                    nomeArtistico: item.bailarino.nomeArtistico,
                })),
                valor,
            };
        });
        return {
            independente: {
                id: inscricao.id,
                nomeResponsavel: inscricao.nomeResponsavel,
                email: inscricao.email,
                whatsapp: inscricao.whatsapp,
                limiteCoreografias: inscricao.limiteCoreografias,
            },
            totais: {
                coreografias: inscricao.coreografias.length,
                assistentesExtras: 0,
                profissionaisExtras: 0,
            },
            valores: {
                coreografias: valorCoreografias,
                assistentesExtras: 0,
                profissionaisExtras: 0,
                total: valorCoreografias,
            },
            detalhamento: {
                coreografias: coreografiasDetalhe,
            },
        };
    }
}
exports.ResumoService = ResumoService;
