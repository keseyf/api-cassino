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
exports.default = RegisterUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
require("@fastify/formbody");
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
function RegisterUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const JWTKEY = process.env.JWT_KEY;
            if (!JWTKEY) {
                throw new Error("No JWTKEY DEFINED");
            }
            const { username, password, email, confirmedPassword } = req.body;
            if (!username || !password || !email) {
                return res.status(400).send("Todos os campos são obrigatórios.");
            }
            if (confirmedPassword != password) {
                return res.status(400).send({ message: "Senhas nao sao iguais" });
            }
            if (username.split("").length > 15 || username.split("").length < 3) {
                return res.status(400).send({
                    message: "Nome de usuario deve conter entre 3 e 15 caracteres!",
                });
            }
            if (username.split("").includes(" ") || /[^a-zA-Z0-9]/.test(username)) {
                return res.status(400).send({
                    message: "Nome de usuario nao pode conter espacos ou caracteres especiais!",
                });
            }
            if (email.split("").includes(" ") || /[^a-zA-Z0-9@._]/.test(email)) {
                return res.status(400).send({
                    message: "Email não pode conter espaços ou caracteres especiais além de @, ., e números!",
                });
            }
            const userName = yield prisma.user.findMany({
                where: {
                    username,
                },
            });
            const userEmail = yield prisma.user.findMany({
                where: {
                    email,
                },
            });
            if (userName.length > 0)
                return res
                    .status(400)
                    .send({ message: "Nome de usuário já cadastrado." });
            if (userEmail.length > 0)
                return res.status(400).send({ message: "Email já cadastrado." });
            const hashPassword = yield bcrypt_1.default.hash(password, 10);
            const user = yield prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashPassword,
                },
            });
            const token = jsonwebtoken_1.default.sign({
                username: user.username,
                email: user.email,
                balance: user.balance,
                createdAt: user.created_at,
            }, JWTKEY, {
                expiresIn: "7d",
            });
            return res
                .status(200)
                .send({ message: "Usuário criado com sucesso!", token });
        }
        catch (error) {
            console.log(error);
        }
    });
}
