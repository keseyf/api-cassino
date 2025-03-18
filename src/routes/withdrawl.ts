import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment } from "mercadopago";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";

dotenv.config();

const prisma = new PrismaClient();
const MPToken = process.env.TOKEN_MP;

if (!MPToken) {
  throw new Error("MercadoPago access token não definido.");
}

const client = new MercadoPagoConfig({ accessToken: MPToken });
const payment = new Payment(client);

export async function processWithdraw(req: FastifyRequest, res: FastifyReply) {
  // Função para gerar um ID único para o saque
  function generateWithdrawId(): string {
    return "withdraw-" + Math.random().toString(36).substring(2, 15);
  }

  const { a, v } = req.body as { a: string; v: number };

  // Verifica se os dados necessários estão presentes
  if (!a || !v) {
    return res
      .status(400)
      .send({ message: "Alguma variável não definida ou valor inválido." });
  }

  const decoded = jwt.decode(a) as JwtPayload | null;
  // Verifica se o token contém as informações do usuário
  if (!decoded || !decoded.pix) {
    return res
      .status(400)
      .send({ message: "Pix ou ID do usuário não encontrado no token." });
  }

  const pix = String(decoded.pix);
  if (!pix) {
    return res.status(400).send({ message: "Chave pix não definida" });
  }

  // Verifica se a chave PIX já foi associada a outro usuário
  const existingUserWithPix = await prisma.user.findFirst({ where: { pix } });
  if (existingUserWithPix) {
    return res
      .status(400)
      .send({ message: "Chave PIX já utilizada por outro usuário!" });
  }

  // Busca o usuário com base no ID decodificado do token
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    return res.status(404).send({ message: "Usuário não encontrado." });
  }

  // Verifica se o usuário tem saldo suficiente
  if (user.balance < v) {
    return res.status(400).send({ message: "Saldo insuficiente." });
  }

  // Cria o registro do saque no banco de dados
  const withdrawal = await prisma.withdraw.create({
    data: {
      userId: user.id,
      amount: v,
      status: "pending",
    },
  });

  // Dados do pagamento a ser feito no MercadoPago
  const paymentData = {
    transaction_amount: v,
    description: `Saque de R$ ${v.toFixed(2)}`,
    payment_method_id: "pix",
    payer: { email: user.email },
  };

  let createdPayment;
  try {
    createdPayment = await payment.create({ body: paymentData });
  } catch (err) {
    return res.status(500).send({
      message: "Erro ao criar pagamento no Mercado Pago.",
      error: err,
    });
  }

  // Verifica se o pagamento foi criado com sucesso
  if (!createdPayment || !createdPayment.id) {
    return res
      .status(500)
      .send({ message: "Erro ao criar pagamento no Mercado Pago." });
  }

  // Atualiza o saque no banco de dados com o ID do pagamento do MercadoPago
  await prisma.withdraw.update({
    where: { id: withdrawal.id },
    data: {
      withdrawId: createdPayment.id.toString(), // Convertendo o ID para string
      status: "completed",
    },
  });

  // Atualiza o saldo do usuário no banco de dados
  await prisma.user.update({
    where: { id: user.id },
    data: { balance: user.balance - v },
  });

  // Retorna a resposta de sucesso
  return res.status(200).send({ message: "Saque realizado com sucesso." });
}
