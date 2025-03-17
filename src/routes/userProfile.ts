import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function Profile(req: FastifyRequest, res: FastifyReply) {
  const { authToken } = req.body as { authToken: string };

  if (!authToken) {
    return res.status(400).send({ message: "Nenhum Token definido!" });
  }

  try {
    const decoded = jwt.decode(authToken) as JwtPayload | null;

    if (!decoded || !decoded.email) {
      return res
        .status(400)
        .send({ message: "Email não encontrado no token." });
    }

    const email = String(decoded.email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { recharges: { orderBy: { createdAt: "desc" } } },
    });

    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado." });
    }

    return res.send(user);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).send({ message: "Erro ao processar requisição." });
  }
}
