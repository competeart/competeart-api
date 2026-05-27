import { PrismaClient } from "@prisma/client";

export class CronogramaService {
  constructor(private prisma: PrismaClient) {}

  async listar() {
    const coreografias = await this.prisma.coreografia.findMany({
      orderBy: [
        { ordemCronograma: "asc" },
        { criadoEm: "asc" },
      ],
      select: {
        id: true,
        nome: true,
        formacao: true,
        modalidade: true,
        categoria: true,
        ordemCronograma: true,
        concluidaCronograma: true,
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
        bailarinos: {
          select: {
            id: true,
          },
        },
      },
    });

    return coreografias.map((coreografia) => ({
      id: coreografia.id,
      nome: coreografia.nome,
      formacao: coreografia.formacao,
      modalidade: coreografia.modalidade,
      categoria: coreografia.categoria,
      ordemCronograma: coreografia.ordemCronograma,
      concluidaCronograma: coreografia.concluidaCronograma,
      escola: coreografia.escola
        ? coreografia.escola.nome
        : `Independente - ${coreografia.independente?.nomeResponsavel ?? "Sem responsável"}`,
      tipoInscricao: coreografia.escola ? "ESCOLA" : "BAILARINO_INDEPENDENTE",
      quantidadeBailarinos: coreografia.bailarinos.length,
    }));
  }

  async reordenar(coreografiasIds: string[]) {
    const totalCoreografias = await this.prisma.coreografia.count();
    const totalSelecionadas = await this.prisma.coreografia.count({
      where: {
        id: { in: coreografiasIds },
      },
    });

    if (
      totalCoreografias !== coreografiasIds.length ||
      totalSelecionadas !== coreografiasIds.length
    ) {
      throw new Error("COREOGRAFIA_INVALIDA");
    }

    await this.prisma.$transaction(
      coreografiasIds.map((id, index) =>
        this.prisma.coreografia.update({
          where: { id },
          data: { ordemCronograma: index },
        }),
      ),
    );

    return this.listar();
  }

  async marcarConclusao(id: string, concluida: boolean) {
    const coreografia = await this.prisma.coreografia.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!coreografia) {
      throw new Error("COREOGRAFIA_NAO_ENCONTRADA");
    }

    await this.prisma.coreografia.update({
      where: { id },
      data: { concluidaCronograma: concluida },
    });

    return this.listar();
  }
}
