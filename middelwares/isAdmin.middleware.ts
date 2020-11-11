import { RequestHandler } from "express";
export let IsAdminMiddleWare: RequestHandler = async (req, res, next) => {
  if (req.isAdmin) {
    next();
  } else {
    res.status(403);
    next("vous n'êtes pas connecté en tant qu'admin");
  }
};
