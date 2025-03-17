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
exports.default = Login;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("@fastify/formbody");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
function Login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const JWTKEY = process.env.JWT_KEY;
        if (!JWTKEY) {
            throw new Error("No JWTKEY provided");
        }
        const { email, password } = req.body;
        {
            if (!email || !password) {
                return res.status(400).send({ message: "Missing required fields!" });
            }
            if (email.split("").includes(" ") || /[^a-zA-Z0-9@._]/.test(email)) {
                return res.status(400).send({
                    message: "Email não pode conter espaços ou caracteres especiais além de @, ., e números!",
                });
            }
            const user = yield prisma.user.findUnique({
                where: {
                    email,
                },
            });
            if (!user) {
                return res.status(404).send({ message: "User not founded" });
            }
            if (yield bcrypt_1.default.compare(password, user.password)) {
                const authToken = jsonwebtoken_1.default.sign({
                    email: user.email,
                    username: user.username,
                    createdAt: user.created_at,
                }, JWTKEY);
                return res
                    .status(200)
                    .send({ message: "Login efeituado com sucesso!", authToken });
            }
            else {
                return res.status(400).send({ message: "Senhas nao coincidem" });
            }
        }
    });
}
