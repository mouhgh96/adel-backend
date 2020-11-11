import { config } from "dotenv";
config();
import { PrismaClient, User } from "@prisma/client";
import Express, { Response, Request, NextFunction } from "express";
import { ApiRouter } from "./routes";
import cors from "cors";

declare global {
  namespace Express {
    interface Request {
      db: PrismaClient;
      userId: number;
      isAdmin: boolean;
      user: User;
    }
  }
}
export const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});
/* prisma.$on("query", (e) => { */
/*   e.query, console.log(e); */
/* }); */
let server = Express();
server.use(cors({ origin: "*" }));
server.use(Express.json());
server.use(Express.urlencoded({ extended: true }));

server.use("/api", (req, _, next) => {
  req.db = prisma;
  next();
});
server.use("/api", ApiRouter);

server.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(res.statusCode || 500);
  res.send({
    error: err || "une error inconnue est survenu",
  });
});
let port = process.env.PORT || 3334;
let host = "localhost";
let protocol = process.env.PROTOCOL || "http";
server.listen(+port, host, () => {
  console.log(`server listening at http://${host}:${port}`);
});
