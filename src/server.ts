import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import RegisterUser from "./routes/registerUser";
import Login from "./routes/login";
import GetBalance from "./routes/getBalance";
import Recharge from "./routes/recharge";
import Profile from "./routes/userProfile";
import Uoseven from "./commands/uoseven";
import { processWithdraw } from "./routes/withdrawl";

const app = fastify();
const port: number = 4040;

app.register(fastifyCors, {
  origin: "*",
});

app.get("/", (req, res) => {
  res.send("teste");
});

app.post("/api/user/register", async (req, res) => {
  try {
    await RegisterUser(req, res);
    res.status(201).send({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.post("/api/user/login", async (req, res) => {
  try {
    await Login(req, res);
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.post("/api/getBalance", async (req, res) => {
  try {
    await GetBalance(req, res);
  } catch {
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.post("/api/user/recharge", async (req, res) => {
  try {
    await Recharge(req, res);
  } catch {
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.post("/api/user/profile", async (req, res) => {
  try {
    await Profile(req, res);
  } catch {
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.post("/api/games/uoseven", async (req, res) => {
  try {
    await Uoseven(req, res);
  } catch {
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.post("/api/user/withdraw", async (req, res) => {
  try {
    await processWithdraw(req, res);
  } catch {
    res.status(500).send({ error: "Erro interno do servidor" });
  }
});

app.listen({ port: port }, (err, address) => {
  if (err) {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
  console.log(`Servidor rodando em ${address}`);
});
