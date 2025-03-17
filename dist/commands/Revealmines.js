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
exports.default = Mines;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
function Mines(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { a, b, m, position } = req.body;
        if (!a || !b || !m || position === undefined) {
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
                return res.send({ message: "Saldo menor que valor de aposta!" });
            }
            if (position < 0 || position >= 25) {
                return res.status(400).send({ message: "Posição inválida." });
            }
            try {
                yield prisma.user.update({
                    data: { balance: user.balance - b },
                    where: { email },
                });
                // Criando tabuleiro internamente com 25 posições
                const totalCells = 25;
                let minePositions = new Set();
                // Distribuindo 'm' minas em posições aleatórias
                while (minePositions.size < m) {
                    minePositions.add(Math.floor(Math.random() * totalCells));
                }
                // Lógica de clique: 51% de chance de mina, 49% estrela
                const isMine = minePositions.has(position) ? Math.random() < 0.51 : false;
                return res.send({
                    position,
                    result: isMine ? "💣" : "⭐",
                });
            }
            catch (_a) {
                return res.send({ message: "Erro ao subtrair valor do saldo!" });
            }
        }
        catch (_b) {
            return res
                .status(500)
                .send({ message: "Erro no lado interno do servidor" });
        }
    });
}
