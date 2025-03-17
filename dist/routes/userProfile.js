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
exports.default = Profile;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
function Profile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { authToken } = req.body;
        if (!authToken) {
            return res.status(400).send({ message: "Nenhum Token definido!" });
        }
        try {
            const decoded = jsonwebtoken_1.default.decode(authToken);
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
            return res.send(user);
        }
        catch (error) {
            console.error("Erro ao buscar perfil:", error);
            return res.status(500).send({ message: "Erro ao processar requisição." });
        }
    });
}
