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
exports.default = GetBalance;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("@fastify/formbody");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
function GetBalance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const JWTKEY = process.env.JWT_KEY;
        if (!JWTKEY) {
            throw new Error("No JWTKEY provided");
        }
        const { authToken } = req.body;
        // Decodifica o token JWT e garante que seja um JwtPayload
        const decoded = jsonwebtoken_1.default.decode(authToken);
        if (!decoded || typeof decoded.email !== "string") {
            throw new Error("Invalid token: email is missing or invalid");
        }
        // Agora você pode usar `decoded.email` com segurança
        const user = yield prisma.user.findUnique({
            where: {
                email: decoded.email
            }
        });
        // Responder com a informação do usuário ou outra lógica de resposta
        if (user) {
            res.send({ balance: user.balance }); // Exemplo de retorno de saldo
        }
        else {
            res.status(404).send({ error: "User not found" });
        }
    });
}
