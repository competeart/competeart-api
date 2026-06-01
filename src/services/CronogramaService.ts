import { promises as fs } from "node:fs";
import path from "node:path";

export type ItemCronograma = {
  id: string;
  ordemCronograma: number;
  nome: string;
  escola: string;
  tempo: string;
  elenco: string;
  coreografo: string;
  contexto: string;
  concluidaCronograma: boolean;
};

const CAMINHO_CRONOGRAMA =
  process.env.CRONOGRAMA_JSON_PATH ||
  path.resolve(process.cwd(), "data", "cronograma.json");

function ordenarCronograma(itens: ItemCronograma[]) {
  return [...itens].sort((a, b) => a.ordemCronograma - b.ordemCronograma);
}

async function escreverArquivoCronograma(itens: ItemCronograma[]) {
  const conteudo = `${JSON.stringify(itens, null, 2)}\n`;
  const arquivoTemporario = `${CAMINHO_CRONOGRAMA}.tmp`;

  await fs.mkdir(path.dirname(CAMINHO_CRONOGRAMA), { recursive: true });
  await fs.writeFile(arquivoTemporario, conteudo, "utf8");
  await fs.rename(arquivoTemporario, CAMINHO_CRONOGRAMA);
}

export class CronogramaService {
  async listar() {
    const conteudo = await fs.readFile(CAMINHO_CRONOGRAMA, "utf8");
    const itens = JSON.parse(conteudo) as ItemCronograma[];

    return ordenarCronograma(itens);
  }

  async reordenar(coreografiasIds: string[]) {
    const itens = await this.listar();
    const idsExistentes = new Set(itens.map((item) => item.id));
    const idsRecebidos = new Set(coreografiasIds);

    if (
      coreografiasIds.length !== itens.length ||
      idsRecebidos.size !== coreografiasIds.length ||
      coreografiasIds.some((id) => !idsExistentes.has(id))
    ) {
      throw new Error("COREOGRAFIA_INVALIDA");
    }

    const porId = new Map(itens.map((item) => [item.id, item]));
    const novaOrdem = coreografiasIds.map((id, index) => ({
      ...porId.get(id)!,
      ordemCronograma: index + 1,
    }));

    await escreverArquivoCronograma(novaOrdem);

    return novaOrdem;
  }

  async marcarConclusao(id: string, concluida: boolean) {
    const itens = await this.listar();
    const existe = itens.some((item) => item.id === id);

    if (!existe) {
      throw new Error("COREOGRAFIA_NAO_ENCONTRADA");
    }

    const atualizados = itens.map((item) =>
      item.id === id ? { ...item, concluidaCronograma: concluida } : item,
    );

    await escreverArquivoCronograma(atualizados);

    return atualizados;
  }
}
