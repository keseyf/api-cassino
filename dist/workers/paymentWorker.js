"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const mercadopago_1 = require("mercadopago");
const date_fns_1 = require("date-fns"); // Biblioteca para manipulação de datas
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const MPToken = process.env.TOKEN_MP;
if (!MPToken) {
    throw new Error("MercadoPago access token is not defined");
}
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: MPToken });
const payment = new mercadopago_1.Payment(client);
function checkPayments() {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingPayments = yield prisma.payment.findMany({
            where: { status: "pending" },
        });
        for (const pay of pendingPayments) {
            try {
                const paymentStatus = yield payment.get({ id: pay.paymentId });
                if ((paymentStatus === null || paymentStatus === void 0 ? void 0 : paymentStatus.status) === "approved") {
                    yield prisma.payment.update({
                        where: { paymentId: pay.paymentId },
                        data: { status: "approved" },
                    });
                    yield prisma.user.update({
                        where: { email: pay.email },
                        data: { balance: { increment: pay.amount } },
                    });
                    console.log(`✅ Pagamento aprovado para ${pay.email}!`);
                }
            }
            catch (error) {
                console.error(`Erro ao verificar pagamento ${pay.paymentId}:`, error);
            }
        }
    });
}
function expireOldPayments() {
    return __awaiter(this, void 0, void 0, function* () {
        const twentyMinutesAgo = (0, date_fns_1.subMinutes)(new Date(), 20);
        // Buscar pagamentos que estão pendentes há mais de 20 minutos
        const expiredPayments = yield prisma.payment.findMany({
            where: {
                status: "pending",
                createdAt: { lt: twentyMinutesAgo }, // Criados antes do tempo limite
            },
        });
        if (expiredPayments.length > 0) {
            // Atualizar o status para "expired"
            yield prisma.payment.updateMany({
                where: {
                    status: "pending",
                    createdAt: { lt: twentyMinutesAgo },
                },
                data: { status: "expired" },
            });
            console.log(`⏳ ${expiredPayments.length} pagamentos expirados.`);
        }
    });
}
// Rodar as funções periodicamente
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    yield checkPayments();
    yield expireOldPayments(); // Expira pagamentos antigos
}), 5000);
console.log("📢 Worker de pagamentos iniciado...");
