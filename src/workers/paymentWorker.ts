import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { subMinutes } from "date-fns"; // Biblioteca para manipulação de datas
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const MPToken = process.env.TOKEN_MP;

if (!MPToken) {
  throw new Error("MercadoPago access token is not defined");
}

const client = new MercadoPagoConfig({ accessToken: MPToken });
const payment = new Payment(client);

async function checkPayments() {
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "pending" },
  });

  for (const pay of pendingPayments) {
    try {
      const paymentStatus = await payment.get({ id: pay.paymentId });

      if (paymentStatus?.status === "approved") {
        await prisma.payment.update({
          where: { paymentId: pay.paymentId },
          data: { status: "approved" },
        });

        await prisma.user.update({
          where: { email: pay.email },
          data: { balance: { increment: pay.amount } },
        });

        console.log(`✅ Pagamento aprovado para ${pay.email}!`);
      }
    } catch (error) {
      console.error(`Erro ao verificar pagamento ${pay.paymentId}:`, error);
    }
  }
}

async function expireOldPayments() {
  const twentyMinutesAgo = subMinutes(new Date(), 20);

  // Buscar pagamentos que estão pendentes há mais de 20 minutos
  const expiredPayments = await prisma.payment.findMany({
    where: {
      status: "pending",
      createdAt: { lt: twentyMinutesAgo }, // Criados antes do tempo limite
    },
  });

  if (expiredPayments.length > 0) {
    // Atualizar o status para "expired"
    await prisma.payment.updateMany({
      where: {
        status: "pending",
        createdAt: { lt: twentyMinutesAgo },
      },
      data: { status: "expired" },
    });

    console.log(`⏳ ${expiredPayments.length} pagamentos expirados.`);
  }
}

// Rodar as funções periodicamente
setInterval(async () => {
  await checkPayments();
  await expireOldPayments(); // Expira pagamentos antigos
}, 5000);

console.log("📢 Worker de pagamentos iniciado...");
