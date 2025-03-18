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

  if (!a || !v) {
    throw new Error("Alguma variável não definida ou valor inválido.");
  }

  const decoded = jwt.decode(a) as JwtPayload | null;
  if (!decoded || !decoded.pix || !decoded.id) {
    throw new Error("Pix ou ID do usuário não encontrado no token.");
  }

  const pix = String(decoded.pix);
  if (!pix) {
    return res.send({ message: "Chave pix nao definida" });
  }
  // Verificar se a chave PIX já foi usada por outro usuário
  const existingUserWithPix = await prisma.user.findFirst({ where: { pix } });
  if (existingUserWithPix) {
    throw new Error("Chave PIX já utilizada por outro usuário!");
  }

  // Buscar usuário pelo token JWT
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  // Verificar saldo do usuário
  if (user.balance < v) {
    throw new Error("Saldo insuficiente.");
  }

  // Criar registro de saque no banco de dados
  const withdrawal = await prisma.withdraw.create({
    data: {
      userId: user.id,
      amount: v,
      status: "pending",
    },
  });

  // Criar pagamento no Mercado Pago
  const paymentData = {
    transaction_amount: v,
    description: `Saque de R$ ${v.toFixed(2)}`,
    payment_method_id: "pix",
    payer: { email: user.email },
  };

  const createdPayment = await payment.create({ body: paymentData });

  if (!createdPayment || !createdPayment.id) {
    throw new Error("Erro ao criar pagamento no Mercado Pago.");
  }

  // Atualizar saque no banco de dados
  await prisma.withdraw.update({
    where: { id: withdrawal.id },
    data: {
      withdrawId: createdPayment.id.toString(), // ✅ Convertendo ID para string
      status: "completed",
    },
  });

  // Atualizar saldo do usuário
  await prisma.user.update({
    where: { id: user.id },
    data: { balance: user.balance - v },
  });

  return { message: "Saque realizado com sucesso." };
}
