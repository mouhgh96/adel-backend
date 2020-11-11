import { NextFunction, Request, Response, Router } from "express";
import * as Yup from "yup";

export let UsersRouter = Router();

UsersRouter.get("/:id", async (req, res, next) => {
  let user = await req.db.user.findOne({
    where: {
      id: +req.params.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      equipe: true,
      username: true,
      domain: {
        select: {
          name: true,
          id: true,
        },
      },
      competences: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  res.send(user);
});
UsersRouter.get("/", async (req, res) => {
  let users = await req.db.user.findMany({
    where: {
      isAdmin: false,
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      lastName: true,
      domain: true,
      competences: true,
      equipe: true,
    },
  });
  res.send(users);
});

UsersRouter.delete("/:id", async (req, res) => {
  let response = await req.db.response.deleteMany({
    where: {
      fromId: +req.params.id,
    },
  });
  let questions = await req.db.question.deleteMany({
    where: {
      authorId: +req.params.id,
    },
  });
  let user = await req.db.user.delete({
    where: {
      id: +req.params.id,
    },
  });
  res.send(user);
});

let ModfyUserValidationMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let scheme = Yup.object().shape({
    firstName: Yup.string().trim().required("le Prenom  est requis"),
    lastName: Yup.string().trim().required("le Nom  est requis"),
    email: Yup.string()
      .trim()
      .email("Veuillez entrer un email valid")
      .required("l'email est requis"),
    username: Yup.string()
      .trim()
      .min(3, "le nom d'utilisateur doit au moins contenir 3 characters")
      .required("le nom d'utilisateur est requis"),

    domain: Yup.number()
      .integer()
      .positive()
      .required("la division est requise"),
    equipe: Yup.number()
      .integer()
      .positive()
      .min(1, "cette equipe est invalide")
      .max(4, "cette equipe est invalide")
      .required("l'equipe est requise"),
    competences: Yup.array()
      .of(Yup.string().trim().min(0))
      .min(1)
      .max(4)
      .required("competences requies"),
  });
  try {
    req.body = await scheme.validate(req.body, { stripUnknown: true });
    next();
  } catch (error) {
    res.status(400);
    next(error.errors[0]);
  }
};
interface SignUpPayload {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  domain: string;
  equipe: number;
  competences: string[];
}

UsersRouter.patch(
  "/:id",
  ModfyUserValidationMiddleWare,
  async (req, res, next) => {
    let {
      email,
      username,
      firstName,
      lastName,
      domain,
      equipe,
      competences,
    } = req.body as SignUpPayload;
    let user = await req.db.user.findOne({
      where: { email: email.toLowerCase() },
    });
    if (user && user.id != +req.params.id) {
      res.status(409);
      next({
        email: `l'email  est deja utilisé`,
      });
      return;
    }
    user = await req.db.user.findOne({
      where: { username: username.toLowerCase() },
    });
    if (user && user.id != +req.params.id) {
      res.status(409);
      next({
        username: `le nom d'utilisateur est deja utilisé`,
      });
      return;
    }
    await req.db.user.update({
      where: {
        id: +req.params.id,
      },
      data: {
        email: email.toLowerCase(),
        username,
        firstName,
        lastName,
        equipe: +equipe,
        isAdmin: false,
        competences: {
          connect: competences.map((comp) => ({ id: +comp })),
        },
        domain: {
          connect: {
            id: +domain,
          },
        },
      },
    });

    res.status(201);
    res.end();
  }
);
