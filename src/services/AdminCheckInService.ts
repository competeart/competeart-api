import { Prisma, PrismaClient, TipoDocumento } from "@prisma/client";

interface BuscarParticipantesInput {
  nome: string;
  limite?: number;
  checkIn?: "TODOS" | "FEITO" | "PENDENTE";
  escolaId?: string;
}

interface ParticipanteCheckIn {
  id: string;
  bailarinoId: string | null;
  nomeCompleto: string;
  tipoDocumento: TipoDocumento | "NAO_INFORMADO";
  documento: string;
  coreografiaId: string | null;
  coreografia: string;
  escola: string;
  tipoInscricao: "ESCOLA" | "BAILARINO_INDEPENDENTE" | "DIRETOR";
  fezCheckIn: boolean;
}

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;
const LIMITE_BUSCA_INTERNA = 200;

function criarIdDocumento(tipoDocumento: TipoDocumento, documento: string) {
  return `documento:${tipoDocumento}:${encodeURIComponent(documento)}`;
}

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
    const documento = termo.replace(/\D/g, "");

    if (termo.length < 2) {
      return [];
    }

    const filtrosBusca: Prisma.BailarinoWhereInput[] = [
      {
        nomeCompleto: {
          contains: termo,
          mode: "insensitive",
        },
      },
    ];

    if (documento.length >= 2) {
      filtrosBusca.push({
        documento: {
          contains: documento,
        },
      });
    }

    const where: Prisma.BailarinoWhereInput = {
      AND: [
        { OR: filtrosBusca },
        {
          coreografias: {
            some: {},
          },
        },
      ],
    };

    if (escolaId) {
      where.escolaId = escolaId;
    }

    const bailarinos = await this.prisma.bailarino.findMany({
      where,
      take: LIMITE_BUSCA_INTERNA,
      orderBy: {
        nomeCompleto: "asc",
      },
      select: {
        id: true,
        nomeCompleto: true,
        tipoDocumento: true,
        documento: true,
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
        coreografias: {
          orderBy: {
            criadoEm: "asc",
          },
          select: {
            coreografiaId: true,
            fezCheckIn: true,
            coreografia: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    const participantesBailarinos = [...this.agruparBailarinosPorDocumento(bailarinos)]
      .filter((participante) => this.filtrarPorStatus(participante, checkIn));

    const diretores = await this.buscarDiretores({
      termo,
      take: LIMITE_BUSCA_INTERNA,
      checkIn,
      escolaId,
    });

    return [...participantesBailarinos, ...diretores]
      .sort((a, b) => {
        const status = Number(a.fezCheckIn) - Number(b.fezCheckIn);
        if (status !== 0) return status;

        return a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR");
      })
      .slice(0, take);
  }

  async fazerCheckIn(id: string) {
    if (id.startsWith("diretor:")) {
      const escolaId = id.replace("diretor:", "");
      const diretor = await this.prisma.escola.findUnique({
        where: { id: escolaId },
        select: { id: true },
      });

      if (!diretor) {
        throw new Error("PARTICIPANTE_NAO_ENCONTRADO");
      }

      await this.prisma.escola.update({
        where: { id: escolaId },
        data: { fezCheckInDiretor: true },
      });

      return {
        id,
        fezCheckIn: true,
      };
    }

    if (id.startsWith("documento:")) {
      const [, tipoDocumento, documentoCodificado] = id.split(":");
      const documento = decodeURIComponent(documentoCodificado ?? "");

      if (
        !["CPF", "RG"].includes(tipoDocumento) ||
        !documento
      ) {
        throw new Error("PARTICIPANTE_NAO_ENCONTRADO");
      }

      const resultado = await this.prisma.coreografiaBailarino.updateMany({
        where: {
          bailarino: {
            tipoDocumento: tipoDocumento as TipoDocumento,
            documento,
          },
        },
        data: { fezCheckIn: true },
      });

      if (resultado.count === 0) {
        throw new Error("PARTICIPANTE_NAO_ENCONTRADO");
      }

      return {
        id,
        fezCheckIn: true,
      };
    }

    const resultado = await this.prisma.coreografiaBailarino.updateMany({
      where: { bailarinoId: id },
      data: { fezCheckIn: true },
    });

    if (resultado.count === 0) {
      throw new Error("PARTICIPANTE_NAO_ENCONTRADO");
    }

    return {
      id,
      fezCheckIn: true,
    };
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

  private agruparBailarinosPorDocumento(
    bailarinos: Array<{
      id: string;
      nomeCompleto: string;
      tipoDocumento: TipoDocumento;
      documento: string;
      escola: { nome: string } | null;
      independente: { nomeResponsavel: string } | null;
      coreografias: Array<{
        coreografiaId: string;
        fezCheckIn: boolean;
        coreografia: { nome: string };
      }>;
    }>,
  ) {
    const agrupados = new Map<string, ParticipanteCheckIn & { totalCoreografias: number }>();

    for (const bailarino of bailarinos) {
      const chave = `${bailarino.tipoDocumento}:${bailarino.documento}`;
      const registroExistente = agrupados.get(chave);
      const totalCoreografias = bailarino.coreografias.length;
      const fezCheckIn =
        totalCoreografias > 0 &&
        bailarino.coreografias.every((coreografia) => coreografia.fezCheckIn);
      const primeiraCoreografia = bailarino.coreografias[0];
      const tipoInscricao: ParticipanteCheckIn["tipoInscricao"] = bailarino.escola
        ? "ESCOLA"
        : "BAILARINO_INDEPENDENTE";
      const escola = bailarino.escola
        ? bailarino.escola.nome
        : `Independente - ${
            bailarino.independente?.nomeResponsavel ?? "Sem responsável"
          }`;

      if (!registroExistente) {
        agrupados.set(chave, {
          id: criarIdDocumento(bailarino.tipoDocumento, bailarino.documento),
          bailarinoId: bailarino.id,
          nomeCompleto: bailarino.nomeCompleto,
          tipoDocumento: bailarino.tipoDocumento,
          documento: bailarino.documento,
          coreografiaId: primeiraCoreografia?.coreografiaId ?? null,
          coreografia:
            totalCoreografias === 1
              ? primeiraCoreografia.coreografia.nome
              : `${totalCoreografias} coreografias`,
          escola,
          tipoInscricao,
          fezCheckIn,
          totalCoreografias,
        });
        continue;
      }

      registroExistente.totalCoreografias += totalCoreografias;
      registroExistente.fezCheckIn = registroExistente.fezCheckIn && fezCheckIn;

      if (registroExistente.escola !== escola) {
        registroExistente.escola = "Múltiplas inscrições";
        registroExistente.tipoInscricao = "ESCOLA";
      }

      registroExistente.coreografia =
        registroExistente.totalCoreografias === 1
          ? registroExistente.coreografia
          : `${registroExistente.totalCoreografias} coreografias`;
    }

    return [...agrupados.values()].map(({ totalCoreografias, ...participante }) => participante);
  }

  private filtrarPorStatus(
    participante: Pick<ParticipanteCheckIn, "fezCheckIn">,
    checkIn: "TODOS" | "FEITO" | "PENDENTE",
  ) {
    if (checkIn === "FEITO") return participante.fezCheckIn;
    if (checkIn === "PENDENTE") return !participante.fezCheckIn;
    return true;
  }

  private async buscarDiretores({
    termo,
    take,
    checkIn,
    escolaId,
  }: {
    termo: string;
    take: number;
    checkIn: "TODOS" | "FEITO" | "PENDENTE";
    escolaId?: string;
  }): Promise<ParticipanteCheckIn[]> {
    const where: Prisma.EscolaWhereInput = {
      nomeDiretor: {
        contains: termo,
        mode: "insensitive",
      },
    };

    if (escolaId) {
      where.id = escolaId;
    }

    if (checkIn === "FEITO") {
      where.fezCheckInDiretor = true;
    }

    if (checkIn === "PENDENTE") {
      where.fezCheckInDiretor = false;
    }

    const diretores = await this.prisma.escola.findMany({
      where,
      take,
      orderBy: {
        nomeDiretor: "asc",
      },
      select: {
        id: true,
        nome: true,
        nomeDiretor: true,
        fezCheckInDiretor: true,
      },
    });

    return diretores.map((escola) => ({
      id: `diretor:${escola.id}`,
      bailarinoId: null,
      nomeCompleto: escola.nomeDiretor,
      tipoDocumento: "NAO_INFORMADO",
      documento: "",
      coreografiaId: null,
      coreografia: "Diretor(a)",
      escola: escola.nome,
      tipoInscricao: "DIRETOR",
      fezCheckIn: escola.fezCheckInDiretor,
    }));
  }
}
