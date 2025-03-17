import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import "@fastify/formbody";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
dotenv.config();

export default async function RegisterUser(
  req: FastifyRequest,
  res: FastifyReply
) {
  try {
    const JWTKEY = process.env.JWT_KEY;

    if (!JWTKEY) {
      throw new Error("No JWTKEY DEFINED");
    }
    const { username, password, email, confirmedPassword } = req.body as {
      username: string;
      password: string;
      email: string;
      confirmedPassword: string;
    };

    if (!username || !password || !email) {
      return res.status(400).send("Todos os campos são obrigatórios.");
    }

    if (confirmedPassword != password) {
      return res.status(400).send({ message: "Senhas nao sao iguais" });
    }

    if (username.split("").length > 15 || username.split("").length < 3) {
      return res.status(400).send({
        message: "Nome de usuario deve conter entre 3 e 15 caracteres!",
      });
    }

    if (username.split("").includes(" ") || /[^a-zA-Z0-9]/.test(username)) {
      return res.status(400).send({
        message:
          "Nome de usuario nao pode conter espacos ou caracteres especiais!",
      });
    }

    if (email.split("").includes(" ") || /[^a-zA-Z0-9@._]/.test(email)) {
      return res.status(400).send({
        message:
          "Email não pode conter espaços ou caracteres especiais além de @, ., e números!",
      });
    }

    const userName = await prisma.user.findMany({
      where: {
        username,
      },
    });

    const userEmail = await prisma.user.findMany({
      where: {
        email,
      },
    });

    if (userName.length > 0)
      return res
        .status(400)
        .send({ message: "Nome de usuário já cadastrado." });
    if (userEmail.length > 0)
      return res.status(400).send({ message: "Email já cadastrado." });

    const hashPassword: string = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashPassword,
      },
    });

    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
        balance: user.balance,
        createdAt: user.created_at,
      },
      JWTKEY,
      {
        expiresIn: "7d",
      }
    );

    return res
      .status(200)
      .send({ message: "Usuário criado com sucesso!", token });
  } catch (error) {
    console.log(error);
  }
}
