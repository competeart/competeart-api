import { PrismaClient, Formacao } from "@prisma/client";
import { calcularValorCoreografia } from "../../lib/lotes";

interface CriarCoreografiaInput {
  escolaId?: string;
  independenteId?: string;
  nome: string;
  nomeCoreografo: string;
  formacao: Formacao;
  modalidade: any;
  categoria: any;
  duracao: string;
  musica: string;
  temCenario: boolean;
  bailarinosIds: string[];
}

export class CoreografiaService {
  constructor(private prisma: PrismaClient) {}

  private validarFormacao(formacao: Formacao, quantidadeBailarinos: number) {
    if (formacao === "SOLO" && quantidadeBailarinos !== 1) {
      throw new Error("FORMACAO_INVALIDA");
    }
    if (formacao === "DUO" && quantidadeBailarinos !== 2) {
      throw new Error("FORMACAO_INVALIDA");
    }
    if (formacao === "TRIO" && quantidadeBailarinos !== 3) {
      throw new Error("FORMACAO_INVALIDA");
    }
    if (formacao === "GRUPO" && quantidadeBailarinos < 4) {
      throw new Error("FORMACAO_INVALIDA");
    }
  }

  private async validarBailarinosDaEscola(escolaId: string, bailarinosIds: string[]) {
    const count = await this.prisma.bailarino.count({
      where: {
        id: { in: bailarinosIds },
        escolaId,
      },
    });

    if (count !== bailarinosIds.length) {
      throw new Error("BAILARINO_INVALIDO");
    }
  }

  private async validarBailarinosDoIndependente(
    independenteId: string,
    bailarinosIds: string[],
  ) {
    const count = await this.prisma.bailarino.count({
      where: {
        id: { in: bailarinosIds },
        independenteId,
      },
    });

    if (count !== bailarinosIds.length) {
      throw new Error("BAILARINO_INVALIDO");
    }
  }

  async criarPorEscola(data: CriarCoreografiaInput & { escolaId: string }) {
    const escola = await this.prisma.escola.findUnique({
      where: { id: data.escolaId },
      include: { coreografias: true },
    });

    if (!escola) {
      throw new Error("ESCOLA_NAO_ENCONTRADA");
    }

    if (escola.coreografias.length >= escola.limiteCoreografias) {
      throw new Error("LIMITE_COREOGRAFIAS_ATINGIDO");
    }

    this.validarFormacao(data.formacao, data.bailarinosIds.length);
    await this.validarBailarinosDaEscola(data.escolaId, data.bailarinosIds);

    return this.prisma.$transaction(async (tx) => {
      const coreografia = await tx.coreografia.create({
        data: {
          nome: data.nome,
          nomeCoreografo: data.nomeCoreografo,
          formacao: data.formacao,
          modalidade: data.modalidade,
          categoria: data.categoria,
          duracao: data.duracao,
          musica: data.musica,
          temCenario: data.temCenario,
          escolaId: data.escolaId,
          independenteId: null,
        },
      });

      await tx.coreografiaBailarino.createMany({
        data: data.bailarinosIds.map((bailarinoId) => ({
          coreografiaId: coreografia.id,
          bailarinoId,
        })),
      });

      return coreografia;
    });
  }

  async criarPorIndependente(
    data: CriarCoreografiaInput & { independenteId: string },
  ) {
    const independente = await this.prisma.inscricaoIndependente.findUnique({
      where: { id: data.independenteId },
      include: { coreografias: true },
    });

    if (!independente) {
      throw new Error("INDEPENDENTE_NAO_ENCONTRADO");
    }

    if (independente.coreografias.length >= independente.limiteCoreografias) {
      throw new Error("LIMITE_COREOGRAFIAS_ATINGIDO");
    }

    this.validarFormacao(data.formacao, data.bailarinosIds.length);
    await this.validarBailarinosDoIndependente(
      data.independenteId,
      data.bailarinosIds,
    );

    return this.prisma.$transaction(async (tx) => {
      const coreografia = await tx.coreografia.create({
        data: {
          nome: data.nome,
          nomeCoreografo: data.nomeCoreografo,
          formacao: data.formacao,
          modalidade: data.modalidade,
          categoria: data.categoria,
          duracao: data.duracao,
          musica: data.musica,
          temCenario: data.temCenario,
          escolaId: null,
          independenteId: data.independenteId,
        },
      });

      await tx.coreografiaBailarino.createMany({
        data: data.bailarinosIds.map((bailarinoId) => ({
          coreografiaId: coreografia.id,
          bailarinoId,
        })),
      });

      return coreografia;
    });
  }

  async listarPorEscola(escolaId: string) {
    const escola = await this.prisma.escola.findUnique({
      where: { id: escolaId },
    });

    if (!escola) {
      throw new Error("ESCOLA_NAO_ENCONTRADA");
    }

    const coreografias = await this.prisma.coreografia.findMany({
      where: { escolaId },
      orderBy: { criadoEm: "asc" },
      include: {
        bailarinos: {
          include: {
            bailarino: {
              select: {
                id: true,
                nomeCompleto: true,
                nomeArtistico: true,
              },
            },
          },
        },
      },
    });

    return coreografias.map((c) => ({
      id: c.id,
      nome: c.nome,
      nomeCoreografo: c.nomeCoreografo,
      formacao: c.formacao,
      modalidade: c.modalidade,
      categoria: c.categoria,
      duracao: c.duracao,
      musica: c.musica,
      temCenario: c.temCenario,
      valor: calcularValorCoreografia(c.formacao, c.bailarinos.length),
      listaBailarinos: c.bailarinos.map((b) => b.bailarino),
    }));
  }

  async listarPorIndependente(independenteId: string) {
    const independente = await this.prisma.inscricaoIndependente.findUnique({
      where: { id: independenteId },
    });

    if (!independente) {
      throw new Error("INDEPENDENTE_NAO_ENCONTRADO");
    }

    const coreografias = await this.prisma.coreografia.findMany({
      where: { independenteId },
      orderBy: { criadoEm: "asc" },
      include: {
        bailarinos: {
          include: {
            bailarino: {
              select: {
                id: true,
                nomeCompleto: true,
                nomeArtistico: true,
              },
            },
          },
        },
      },
    });

    return coreografias.map((c) => ({
      id: c.id,
      nome: c.nome,
      nomeCoreografo: c.nomeCoreografo,
      formacao: c.formacao,
      modalidade: c.modalidade,
      categoria: c.categoria,
      duracao: c.duracao,
      musica: c.musica,
      temCenario: c.temCenario,
      valor: calcularValorCoreografia(c.formacao, c.bailarinos.length),
      listaBailarinos: c.bailarinos.map((b) => b.bailarino),
    }));
  }
}
