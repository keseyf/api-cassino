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
exports.default = Recharge;
const client_1 = require("@prisma/client");
const mercadopago_1 = require("mercadopago");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const date_fns_1 = require("date-fns"); // Biblioteca útil para trabalhar com datas
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const minRv = 1;
const MPToken = process.env.TOKEN_MP;
if (!MPToken) {
    throw new Error("MercadoPago access token is not defined");
}
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: MPToken });
const payment = new mercadopago_1.Payment(client);
function Recharge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { rv, authToken } = req.body;
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
            const decoded = jsonwebtoken_1.default.decode(authToken);
            if (!decoded || !decoded.email) {
                return res
                    .status(400)
                    .send({ message: "Email não encontrado no token." });
            }
            const email = String(decoded.email);
            // Verificar se há um pagamento pendente nos últimos 20 minutos
            const twentyMinutesAgo = (0, date_fns_1.subMinutes)(new Date(), 20);
            const existingPayment = yield prisma.payment.findFirst({
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
            const response = yield payment.create({
                body: {
                    transaction_amount: rv,
                    payment_method_id: "pix",
                    payer: { email },
                },
            });
            if (!((_b = (_a = response === null || response === void 0 ? void 0 : response.point_of_interaction) === null || _a === void 0 ? void 0 : _a.transaction_data) === null || _b === void 0 ? void 0 : _b.qr_code)) {
                throw new Error("Chave Pix não disponível.");
            }
            const pixCopyPasteKey = response.point_of_interaction.transaction_data.qr_code;
            const paymentId = response.id;
            if (!paymentId) {
                throw new Error("ID do pagamento não encontrado.");
            }
            // Criar o pagamento no banco de dados
            yield prisma.payment.create({
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
        }
        catch (error) {
            console.error("Erro ao criar pagamento Pix:", error);
            return res.status(500).send("Erro ao processar pagamento.");
        }
    });
}
