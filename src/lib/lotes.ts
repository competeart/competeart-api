import { Formacao } from "@prisma/client";

export function obterLoteAtual(dataReferencia = new Date()): 1 | 2 | 3 {
  const ano = 2026;

  const fimLote1 = new Date(ano, 3, 10, 23, 59, 59, 999);
  const fimLote2 = new Date(ano, 3, 30, 23, 59, 59, 999);

  if (dataReferencia <= fimLote1) return 1;
  if (dataReferencia <= fimLote2) return 2;
  return 3;
}

export function calcularValorCoreografia(
  formacao: Formacao,
  quantidadeBailarinos: number,
  dataReferencia = new Date(),
) {
  const lote = obterLoteAtual(dataReferencia);

  const tabela: Record<Formacao, number[]> = {
    SOLO: [160, 190, 210],
    DUO: [220, 240, 260],
    TRIO: [320, 340, 360],
    GRUPO: [80, 100, 120],
  };

  if (formacao === Formacao.GRUPO) {
    return tabela.GRUPO[lote - 1] * quantidadeBailarinos;
  }

  return tabela[formacao][lote - 1];
}
