import { FastifyInstance } from "fastify";
import { InstagramService } from "./instagram.service";

export async function instagramRoutes(app: FastifyInstance) {
  const service = new InstagramService();

  app.get("/instagram/feed", async (_request, reply) => {
    try {
      const feed = await service.listarUltimasPublicacoes();

      reply.header(
        "Cache-Control",
        "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
      );

      return feed;
    } catch (error) {
      app.log.warn({ error }, "Falha ao carregar o feed do Instagram");

      return reply.code(502).send({
        message: "Feed do Instagram temporariamente indisponível",
      });
    }
  });
}
