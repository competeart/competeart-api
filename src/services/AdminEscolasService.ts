import { PrismaClient, Formacao } from "@prisma/client";

export class AdminEscolasService {
  constructor(private prisma: PrismaClient) {}

  private calcularStatusPorEtapas(
    possuiElenco: boolean,
    possuiCoreografia: boolean,
  ) {
    if (!possuiElenco) return "FALTA_ELENCO";
    if (!possuiCoreografia) return "FALTA_COREOGRAFIA";
    return "COMPLETO";
  }

  private calcularValorCoreografias(
    coreografias: Array<{ formacao: Formacao; bailarinos: Array<any> }>,
  ) {
    let valorCoreografias = 0;

    coreografias.forEach((c) => {
      const qtd = c.bailarinos.length;

      switch (c.formacao) {
        case Formacao.SOLO:
          valorCoreografias += 160;
          break;
        case Formacao.DUO:
          valorCoreografias += 220;
          break;
        case Formacao.TRIO:
          valorCoreografias += 320;
          break;
        case Formacao.GRUPO:
          valorCoreografias += qtd * 80;
          break;
      }
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
      const status = this.calcularStatusPorEtapas(
        escola.bailarinos.length > 0,
        escola.coreografias.length > 0,
      );

      return {
        id: escola.id,
        nome: escola.nome,
        whatsapp: escola.whatsapp,
        limiteCoreografias: escola.limiteCoreografias,
        bailarinosCadastrados: escola.bailarinos.length,
        coreografiasCadastradas: escola.coreografias.length,
        valorTotal: total,
        tipoInscricao: "ESCOLA",
        status,
      };
    });

    const inscricoesIndependentes = independentes.map((independente) => {
      const valorCoreografias = this.calcularValorCoreografias(
        independente.coreografias,
      );
      const status = this.calcularStatusPorEtapas(
        independente.bailarinos.length > 0,
        independente.coreografias.length > 0,
      );

      return {
        id: independente.id,
        nome: independente.nomeResponsavel,
        whatsapp: independente.whatsapp,
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
}
