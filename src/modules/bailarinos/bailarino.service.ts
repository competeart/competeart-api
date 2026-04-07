import { PrismaClient } from "@prisma/client";

interface CriarBailarinoInput {
  escolaId?: string;
  independenteId?: string;
  nomeCompleto: string;
  nomeArtistico: string;
  tipoDocumento: "CPF" | "RG";
  documento: string;
  dataNascimento: string;
}

export class BailarinoService {
  constructor(private prisma: PrismaClient) {}

  async criarPorEscola(data: CriarBailarinoInput & { escolaId: string }) {
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

  async criarPorIndependente(
    data: CriarBailarinoInput & { independenteId: string },
  ) {
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

  async criar(data: CriarBailarinoInput) {
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

  async listarPorEscola(escolaId: string) {
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

  async listarPorIndependente(independenteId: string) {
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
