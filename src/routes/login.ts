import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import "@fastify/formbody";
import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
const prisma = new PrismaClient();

dotenv.config();

export default async function Login(req: FastifyRequest, res: FastifyReply) {
  const JWTKEY = process.env.JWT_KEY;

  if (!JWTKEY) {
    throw new Error("No JWTKEY provided");
  }

  const { email, password } = req.body as {
    email: string;
    password: string;
  };
  {
    if (!email || !password) {
      return res.status(400).send({ message: "Missing required fields!" });
    }

    if (email.split("").includes(" ") || /[^a-zA-Z0-9@._]/.test(email)) {
      return res.status(400).send({
        message:
          "Email não pode conter espaços ou caracteres especiais além de @, ., e números!",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User not founded" });
    }

    if (await bcrypt.compare(password, user.password)) {
      const authToken = jwt.sign(
        {
          email: user.email,
          username: user.username,
          createdAt: user.created_at,
        },
        JWTKEY
      );

      return res
        .status(200)
        .send({ message: "Login efeituado com sucesso!", authToken });
    } else {
      return res.status(400).send({ message: "Senhas nao coincidem" });
    }
  }
}
