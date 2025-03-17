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
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const registerUser_1 = __importDefault(require("./routes/registerUser"));
const login_1 = __importDefault(require("./routes/login"));
const getBalance_1 = __importDefault(require("./routes/getBalance"));
const recharge_1 = __importDefault(require("./routes/recharge"));
const userProfile_1 = __importDefault(require("./routes/userProfile"));
const uoseven_1 = __importDefault(require("./commands/uoseven"));
const app = (0, fastify_1.default)();
const port = 4040;
app.register(cors_1.default, {
    origin: "*",
});
app.get("/", (req, res) => {
    res.send("teste");
});
app.post("/api/user/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, registerUser_1.default)(req, res);
        res.status(201).send({ message: "Usuário registrado com sucesso!" });
    }
    catch (error) {
        console.error("Erro ao registrar usuário:", error);
        res.status(500).send({ error: "Erro interno do servidor" });
    }
}));
app.post("/api/user/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, login_1.default)(req, res);
    }
    catch (error) {
        console.error("Erro ao registrar usuário:", error);
        res.status(500).send({ error: "Erro interno do servidor" });
    }
}));
app.post("/api/getBalance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, getBalance_1.default)(req, res);
    }
    catch (_a) {
        res.status(500).send({ error: "Erro interno do servidor" });
    }
}));
app.post("/api/user/recharge", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, recharge_1.default)(req, res);
    }
    catch (_a) {
        res.status(500).send({ error: "Erro interno do servidor" });
    }
}));
app.post("/api/user/profile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, userProfile_1.default)(req, res);
    }
    catch (_a) {
        res.status(500).send({ error: "Erro interno do servidor" });
    }
}));
app.post("/api/games/uoseven", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, uoseven_1.default)(req, res);
    }
    catch (_a) {
        res.status(500).send({ error: "Erro interno do servidor" });
    }
}));
app.listen({ port: port }, (err, address) => {
    if (err) {
        console.error("Erro ao iniciar o servidor:", err);
        process.exit(1);
    }
    console.log(`Servidor rodando em ${address}`);
});
