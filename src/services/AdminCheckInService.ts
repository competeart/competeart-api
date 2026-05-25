import { Prisma, PrismaClient, TipoDocumento } from "@prisma/client";

interface BuscarParticipantesInput {
  nome: string;
  limite?: number;
  checkIn?: "TODOS" | "FEITO" | "PENDENTE";
  escolaId?: string;
}

interface ParticipanteCheckIn {
  id: string;
  bailarinoId: string;
  nomeCompleto: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  coreografiaId: string;
  coreografia: string;
  escola: string;
  tipoInscricao: "ESCOLA" | "BAILARINO_INDEPENDENTE";
  fezCheckIn: boolean;
}

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;

export class AdminCheckInService {
  constructor(private prisma: PrismaClient) {}

  async buscarParticipantes({
    nome,
    limite = LIMITE_PADRAO,
    checkIn = "TODOS",
    escolaId,
  }: BuscarParticipantesInput): Promise<ParticipanteCheckIn[]> {
    const termo = nome.trim();
    const take = Math.min(limite, LIMITE_MAXIMO);

    if (termo.length < 2) {
      return [];
    }

    const where: Prisma.CoreografiaBailarinoWhereInput = {
      bailarino: {
        nomeCompleto: {
          contains: termo,
          mode: "insensitive",
        },
      },
    };

    if (checkIn === "FEITO") {
      where.fezCheckIn = true;
    }

    if (checkIn === "PENDENTE") {
      where.fezCheckIn = false;
    }

    if (escolaId) {
      where.coreografia = {
        escolaId,
      };
    }

    const participantes = await this.prisma.coreografiaBailarino.findMany({
      where,
      take,
      orderBy: [
        { fezCheckIn: "asc" },
        { criadoEm: "asc" },
      ],
      select: {
        id: true,
        bailarinoId: true,
        coreografiaId: true,
        fezCheckIn: true,
        bailarino: {
          select: {
            nomeCompleto: true,
            tipoDocumento: true,
            documento: true,
          },
        },
        coreografia: {
          select: {
            nome: true,
            escola: {
              select: {
                nome: true,
              },
            },
            independente: {
              select: {
                nomeResponsavel: true,
              },
            },
          },
        },
      },
    });

    return participantes.map((participante) => {
      const escola = participante.coreografia.escola;
      const independente = participante.coreografia.independente;

      return {
        id: participante.id,
        bailarinoId: participante.bailarinoId,
        nomeCompleto: participante.bailarino.nomeCompleto,
        tipoDocumento: participante.bailarino.tipoDocumento,
        documento: participante.bailarino.documento,
        coreografiaId: participante.coreografiaId,
        coreografia: participante.coreografia.nome,
        escola: escola
          ? escola.nome
          : `Independente - ${independente?.nomeResponsavel ?? "Sem responsável"}`,
        tipoInscricao: escola ? "ESCOLA" : "BAILARINO_INDEPENDENTE",
        fezCheckIn: participante.fezCheckIn,
      };
    });
  }

  async fazerCheckIn(id: string) {
    const participante = await this.prisma.coreografiaBailarino.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!participante) {
      throw new Error("PARTICIPANTE_NAO_ENCONTRADO");
    }

    return this.prisma.coreografiaBailarino.update({
      where: { id },
      data: { fezCheckIn: true },
      select: {
        id: true,
        fezCheckIn: true,
      },
    });
  }

  async listarEscolas() {
    return this.prisma.escola.findMany({
      orderBy: {
        nome: "asc",
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }
}
