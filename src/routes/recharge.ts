import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment } from "mercadopago";
import jwt, { JwtPayload } from "jsonwebtoken";
import { subMinutes } from "date-fns"; // Biblioteca útil para trabalhar com datas
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const minRv = 1;
const MPToken = process.env.TOKEN_MP;

if (!MPToken) {
  throw new Error("MercadoPago access token is not defined");
}

const client = new MercadoPagoConfig({ accessToken: MPToken });
const payment = new Payment(client);

export default async function Recharge(req: FastifyRequest, res: FastifyReply) {
  const { rv, authToken } = req.body as { rv: number; authToken: string };

  if (!rv || !authToken) {
    return res
      .status(400)
      .send({ message: "Todos os campos são necessários!" });
  }
  if (!(rv >= minRv)) {
    return res.status(400).send({ message: "Valor minimo de recarga: R$1.00" });
  }
  if (rv > 1000) {
    return res
      .status(400)
      .send({ message: "Valor maximo de recarga: R$1000.00" });
  }

  try {
    // Decodificar o token JWT
    const decoded = jwt.decode(authToken) as JwtPayload | null;

    if (!decoded || !decoded.email) {
      return res
        .status(400)
        .send({ message: "Email não encontrado no token." });
    }

    const email = String(decoded.email);

    // Verificar se há um pagamento pendente nos últimos 20 minutos
    const twentyMinutesAgo = subMinutes(new Date(), 20);

    const existingPayment = await prisma.payment.findFirst({
      where: {
        email,
        status: "pending",
        createdAt: { gte: twentyMinutesAgo }, // Verifica se foi criado há no máximo 20 minutos
      },
    });

    if (existingPayment) {
      return res
        .status(400)
        .send({
          message: "Você já possui um pagamento pendente! Verifique no perfil.",
        });
    }

    // Criar o pagamento via MercadoPago
    const response = await payment.create({
      body: {
        transaction_amount: rv,
        payment_method_id: "pix",
        payer: { email },
      },
    });

    if (!response?.point_of_interaction?.transaction_data?.qr_code) {
      throw new Error("Chave Pix não disponível.");
    }

    const pixCopyPasteKey =
      response.point_of_interaction.transaction_data.qr_code;
    const paymentId = response.id;

    if (!paymentId) {
      throw new Error("ID do pagamento não encontrado.");
    }

    // Criar o pagamento no banco de dados
    await prisma.payment.create({
      data: {
        email,
        amount: rv,
        paymentId: String(paymentId),
        status: "pending",
        qrcode: pixCopyPasteKey,
      },
    });

    return res.send({
      message: "Pagamento criado com sucesso. Use a chave Pix para pagar: ",
      pixCopyPasteKey, // Enviar chave Pix para uso
      qrCode: pixCopyPasteKey, // Enviar QR Code gerado também
    });
  } catch (error) {
    console.error("Erro ao criar pagamento Pix:", error);
    return res.status(500).send("Erro ao processar pagamento.");
  }
}
