// import { PrismaClient } from "@prisma/client";
// import mercadopago from "mercadopago";

// const prisma = new PrismaClient();

// mercadopago.configurations.setAccessToken("YOUR_MERCADO_PAGO_ACCESS_TOKEN");

// async function withdrawFunds(userId: string, amount: number) {
//   // Verificar se o usuário existe
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) {
//     throw new Error("Usuário não encontrado.");
//   }

//   // Verificar se o usuário tem saldo suficiente
//   if (user.balance < amount) {
//     throw new Error("Saldo insuficiente.");
//   }

//   // Criar o saque no banco de dados
//   const withdrawal = await prisma.withdraw.create({
//     data: {
//       email: user.email,
//       userId: user.id,
//       amount,
//       status: "pending",
//       withdrawId: generateWithdrawId(),
//     },
//   });

//   // Realizar o saque via Mercado Pago
//   try {
//     const paymentData = {
//       transaction_amount: amount,
//       description: `Saque de ${amount}`,
//       payer_email: user.email,
//       payment_method_id: "pix", // Usando o método de pagamento PIX
//     };

//     const payment = await mercadopago.payment.create(paymentData);

//     // Atualizar o saque com o ID do pagamento do Mercado Pago
//     await prisma.withdraw.update({
//       where: { id: withdrawal.id },
//       data: {
//         withdrawId: payment.response.id,
//         status: "completed", // Atualiza para "completed" caso o pagamento seja bem-sucedido
//       },
//     });

//     // Atualizar o saldo do usuário
//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         balance: user.balance - amount,
//       },
//     });

//     return { message: "Saque realizado com sucesso." };
//   } catch (error) {
//     console.error(error);
//     await prisma.withdraw.update({
//       where: { id: withdrawal.id },
//       data: {
//         status: "failed",
//       },
//     });
//     throw new Error("Erro ao realizar saque.");
//   }
// }

// function generateWithdrawId() {
//   return "withdraw-" + Math.random().toString(36).substring(2, 15); // Gera um ID único simples
// }
