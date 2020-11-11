import { compare, hash } from "bcryptjs";
import { addDays } from "date-fns";
import { NextFunction, Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import * as Yup from "yup";
import { JWTPayload } from "../interfaces";
let AuthRouter = Router();

interface LoginPayload {
  password: string;
  email: string;
}
let loginValidationMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let scheme = Yup.object().shape({
    email: Yup.string()
      .email("Veuillez entrer un email valid")
      .required("l'email est requis"),
    password: Yup.string().required("le mot de passe est requis"),
  });

  try {
    req.body = await scheme.validate(req.body, { stripUnknown: true });
    next();
  } catch (error) {
    res.status(400);
    next(error.errors[0]);
  }
};
AuthRouter.post("/login", async (req, res, next) => {
  let { email, password } = req.body as LoginPayload;

  let user = await req.db.user.findOne({
    where: {
      email: email.toLowerCase(),
    },
    select: {
      id: true,
      username: true,
      password: true,
      isAdmin: true,
    },
  });

  if (!user) {
    res.status(401);
    next("vos identifiants sont incorrectes");
    return;
  }

  let isValid = await compare(password, user.password);
  if (!isValid) {
    res.status(401);
    next("vos identifiants sont incorrectes");
    return;
  }
  let token = jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    } as JWTPayload,
    process.env.SECRET || "mysecretkey",
    {
      expiresIn: addDays(Date.now(), 1).getTime(),
    }
  );
  res.send({
    access_token: token,
    is_admin: user.isAdmin,
  });
});

let SignUpvalidationMiddleWare = async (
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
    password: Yup.string()
      .matches(
        /^[0-9a-z_$-]{7,}$/i,
        "le mot de passe doit au moins contenir 7 characters (a-z,0-9,_-$)"
      )
      .required("le mot de passe est requis"),
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
AuthRouter.post(
  "/signup",
  SignUpvalidationMiddleWare,
  async (req, res, next) => {
    let {
      email,
      password,
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
    if (user) {
      res.status(409);
      next({
        email: `l'email  est deja utilisé`,
      });
      return;
    }
    user = await req.db.user.findOne({
      where: { username: username.toLowerCase() },
    });
    if (user) {
      res.status(409);
      next({
        username: `le nom d'utilisateur est deja utilisé`,
      });
      return;
    }

    let hashedPassword = await hash(password, 12);
    await req.db.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
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

AuthRouter.get("/domains", async (req, res) => {
  let domains = await req.db.domain.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  res.send(domains);
});

AuthRouter.get("/domains/:id/competences", async (req, res) => {
  if (!req.params.id || isNaN(+req.params.id)) {
    res.send([]);
    return;
  }
  let competences = await req.db.competence.findMany({
    where: {
      domain: { id: +req.params.id },
    },
    select: {
      id: true,
      name: true,
    },
  });
  res.send(competences);
});
export { AuthRouter };
/**
une vulnerabilité (failles): est un defaults  dans le systeme(conception, configuration, constructionk) qui expose le systeme à des menaces possible
*/
