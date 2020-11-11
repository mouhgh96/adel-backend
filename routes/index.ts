import { Router } from "express";
import { AuthRouter } from "./auth";
import { QuestionRouter } from "./question_router";
import { AuthMiddleWare } from "../middelwares";
import { UsersRouter } from "./user_router";
import { IsAdminMiddleWare } from "../middelwares/isAdmin.middleware";

let ApiRouter = Router();

ApiRouter.use("/questions", AuthMiddleWare, QuestionRouter);
ApiRouter.use("/auth", AuthRouter);
ApiRouter.use("/users", AuthMiddleWare, IsAdminMiddleWare, UsersRouter);
export { ApiRouter };
