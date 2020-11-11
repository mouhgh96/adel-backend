import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../interfaces";
export let AuthMiddleWare: RequestHandler = async (req, res, next) => {
  let payload: string = req.headers.authorization || "";
  if (!payload.trim()) {
    res.status(401);
    next("veuillez vous connecter");
    return;
  }

  let result = payload.split(" ");
  if (result.length < 2) {
    res.status(401);
    next("veuillez vous connecter");
    return;
  }
  let token = result[1];
  try {
    let obj = jwt.verify(
      token,
      process.env.SECRET || "mysecretkey"
    ) as JWTPayload;

    req.userId = +obj.id;
    req.isAdmin = obj.isAdmin;
    let user = await req.db.user.findOne({ where: { id: req.userId } });
    if (!user) {
      res.status(401);
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next("veuillez vous connecter");
    return;
  }
};
