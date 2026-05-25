import { FastifyRequest, FastifyReply } from "fastify";

export async function checkInAuth(request: FastifyRequest, reply: FastifyReply) {
  const checkInKey = request.headers["x-checkin-key"];
  const adminKey = request.headers["x-admin-key"];

  const acessoModerador = checkInKey && checkInKey === process.env.CHECKIN_KEY;
  const acessoAdmin = adminKey && adminKey === process.env.ADMIN_KEY;

  if (!acessoModerador && !acessoAdmin) {
    return reply.status(401).send({
      message: "Não autorizado",
    });
  }
}
