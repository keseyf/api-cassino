import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import "@fastify/formbody";
import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
const prisma = new PrismaClient();

dotenv.config();

export default async function GetBalance(req: FastifyRequest, res: FastifyReply) {
  const JWTKEY = process.env.JWT_KEY;

  if (!JWTKEY) {
    throw new Error("No JWTKEY provided");
  }

  const { authToken } = req.body as { authToken: string };

  // Decodifica o token JWT e garante que seja um JwtPayload
  const decoded = jwt.decode(authToken) as JwtPayload | null;

  if (!decoded || typeof decoded.email !== "string") {
    throw new Error("Invalid token: email is missing or invalid");
  }

  // Agora você pode usar `decoded.email` com segurança
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email
    }
  });

  // Responder com a informação do usuário ou outra lógica de resposta
  if (user) {
    res.send({ balance: user.balance }); // Exemplo de retorno de saldo
  } else {
    res.status(404).send({ error: "User not found" });
  }
}
