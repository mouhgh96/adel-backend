import { Router, Request, Response, NextFunction } from "express";
import * as Yup from "yup";
import { smtpClient } from "../email";

let QuestionRouter = Router();

QuestionRouter.get("/", async (req, res, next) => {
  let domain = req.query.domain as string;
  let content = req.query.content as string;
  let condition = {};
  console.log(content);
  if (domain) {
    condition = {
      ...condition,
      domain: {
        name: { contains: domain.trim() },
      },
    };
  }
  if (content) {
    condition = {
      ...condition,
      OR: [
        {
          title: {
            contains: content.trim(),
          },
        },
        {
          content: {
            contains: content.trim(),
          },
        },
      ],
    };
  }
  let questions = await req.db.question.findMany({
    where: {
      ...condition,
    },
    select: {
      author: {
        select: {
          username: true,
          id: true,
        },
      },
      id: true,
      title: true,
      content: true,
      domain: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  questions = questions.map((question) => {
    if (question.author.id === req.userId) {
      //@ts-ignore
      question.editable = true;
    } else {
      //@ts-ignore
      question.editable = false;
    }
    return question;
  });
  res.send(questions);
});

interface QuestionCreatePayload {
  title: string;
  content: string;
  domain: string;
}
let PostQuestionMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let scheme = Yup.object().shape({
    title: Yup.string().trim().required("le titre de la question est requis"),
    content: Yup.string()
      .trim()
      .required("le contenu de la question est requis"),
    domain: Yup.number()
      .integer()
      .positive()
      .required("le domaine de la question est requis"),
  });

  try {
    req.body = await scheme.validate(req.body, { stripUnknown: true });
    next();
  } catch (error) {
    console.log(error);
    res.status(400);
    next({ [error.path]: error.errors[0] });
  }
};
QuestionRouter.post("/", PostQuestionMiddleWare, async (req, res, next) => {
  let { title, content, domain } = req.body as QuestionCreatePayload;
  let question = await req.db.question.create({
    data: {
      title,
      content,
      author: {
        connect: {
          id: req.userId,
        },
      },
      domain: {
        connect: {
          id: +domain,
        },
      },
    },
    select: {
      id: true,
      content: true,
      title: true,
      authorId: true,
      updatedAt: true,
      createdAt: true,
      domain: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
  res.status(201);
  question.authorId;
  res.send(question);
});

QuestionRouter.get("/:id", async (req, res, next) => {
  let id: number = +req.params.id;
  let question = await req.db.question.findOne({
    where: {
      id,
    },
    select: {
      content: true,
      title: true,
      updatedAt: true,
      domain: true,
      author: { select: { username: true, id: true } },
      responses: {
        include: {
          from: {
            select: {
              username: true,
              id: true,
            },
          },
        },
      },
    },
  });
  if (!question) {
    res.status(404);
    res.end();
    return;
  }
  res.send({
    ...question,
    editable: question.author.id === req.userId,
    responses: question.responses.map((response) => {
      return {
        ...response,
        editable: response.fromId == req.userId,
      };
    }),
  });
});

QuestionRouter.delete("/:id", async (req, res, next) => {
  let question = await req.db.question.findOne({
    where: {
      id: +req.params.id,
    },
    select: {
      authorId: true,
      title: true,
      content: true,
      id: true,
    },
  });
  if (!question) {
    res.status(404);
    res.end();
    return;
  }
  console.log(question);
  if (question.authorId != req.userId) {
    res.status(401);
    res.end();
    return;
  }

  await req.db.question.delete({
    where: {
      id: +req.params.id,
    },
  });
  res.send(question);
});

QuestionRouter.get("/:id/responses", async (req, res, next) => {
  let questionId = req.params.id as string;
  let result = await req.db.question.findOne({
    where: {
      id: +questionId,
    },
    select: {
      responses: {
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          from: {
            select: {
              id: true,
              username: true,
            },
          },
          content: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!result) {
    res.status(404);
    res.send(null);
    return;
  }
  let responses = result.responses.map((response) => {
    if (response.from.id == req.userId) {
      return {
        ...response,
        editable: true,
      };
    } else {
      return {
        ...response,
        editable: false,
      };
    }
  });
  res.send(responses);
});

QuestionRouter.post("/:id/responses", async (req, res, next) => {
  let question = await req.db.question.findOne({
    where: {
      id: +req.params.id,
    },
    select: {
      id: true,
      author: true,
      title: true,
    },
  });
  console.log(question);
  if (!question) {
    res.status(404);
    res.end();
    return;
  }

  let response = await req.db.response.create({
    data: {
      content: req.body.content,
      to: {
        connect: {
          id: +question.id,
        },
      },
      from: {
        connect: {
          id: +req.userId,
        },
      },
    },
    select: {
      from: {
        select: {
          username: true,
          id: true,
        },
      },
      id: true,
      updatedAt: true,
      content: true,
    },
  });
  let host = process.env.HOST || "localhost";
  if (req.userId !== question.author.id) {
    smtpClient.sendMail({
      from: "admin@pfe.com",
      to: question.author.email,
      subject: "Une reponse à eté donner",
      html: `
    <b>${req.user.lastName} ${req.user.firstName}</b> à repondu à votre 
    <a href="http://${host}/uestions/${question.id}#${response.id}">question</a>
      <b><i>${question.title}</i></b>
    `,
    });
    console.log({
      from: "admin@pfe.com",
      to: question.author.email,
      subject: "Une reponse à eté donner",
      html: `
    <b>${req.user.lastName} ${req.user.firstName}</b> à repondu à votre 
    <a href="http://${host}/questions/${question.id}#${response.id}">question</a>
      <b><i>${question.title}</i></b>
    `,
    });
  }
  res.send(response);
});
QuestionRouter.delete(
  "/:questionId/responses/:responseId",
  async (req, res, next) => {
    let response = await req.db.response.findOne({
      where: {
        id: +req.params.responseId,
      },
      select: {
        fromId: true,
      },
    });
    if (!response) {
      res.status(404);
      return;
    }
    if (response.fromId != req.userId) {
      res.status(401);
      return;
    }
    response = await req.db.response.delete({
      where: {
        id: +req.params.responseId,
      },
    });
    if (!response) {
      res.status(404);
      res.end();
      return;
    }

    res.send(response);
  }
);
export { QuestionRouter };
