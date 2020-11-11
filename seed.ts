import { PrismaClient, Domain, Competence } from "@prisma/client";
import faker from "faker/locale/fr";
import { hash } from "bcryptjs";
let prisma = new PrismaClient();
let main = async () => {
  await prisma.competence.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.response.deleteMany({});
  await prisma.question.deleteMany({});
  await createDomain();
  await createAdmin();
};
let createDomain = async () => {
  let competences = [
    {
      name: "fitrage d'information",
      domain: {
        connectOrCreate: {
          where: {
            name: "securité informatique",
          },
          create: {
            name: "securité informatique",
          },
        },
      },
    },
    {
      name: "sécurité du routage",
      domain: {
        connectOrCreate: {
          where: {
            name: "securité informatique",
          },
          create: {
            name: "securité informatique",
          },
        },
      },
    },
    {
      name: "sécurité des applications web",
      domain: {
        connectOrCreate: {
          where: {
            name: "securité informatique",
          },
          create: {
            name: "securité informatique",
          },
        },
      },
    },
    {
      name: "sécurité des reseaux",
      domain: {
        connectOrCreate: {
          where: {
            name: "securité informatique",
          },
          create: {
            name: "securité informatique",
          },
        },
      },
    },
    {
      name: "big data",
      domain: {
        connectOrCreate: {
          where: {
            name: "dtisi",
          },
          create: {
            name: "dtisi",
          },
        },
      },
    },
    {
      name: "big graph",
      domain: {
        connectOrCreate: {
          where: {
            name: "dtisi",
          },
          create: {
            name: "dtisi",
          },
        },
      },
    },
    {
      name: "hpc",
      domain: {
        connectOrCreate: {
          where: {
            name: "dtisi",
          },
          create: {
            name: "dtisi",
          },
        },
      },
    },
    {
      name: "ict",
      domain: {
        connectOrCreate: {
          where: {
            name: "dtisi",
          },
          create: {
            name: "dtisi",
          },
        },
      },
    },
    {
      name: "arabe",
      domain: {
        connectOrCreate: {
          where: {
            name: "recherche et developpement",
          },
          create: {
            name: "recherche et developpement",
          },
        },
      },
    },
    {
      name: "cadre juridique",
      domain: {
        connectOrCreate: {
          where: {
            name: "recherche et developpement",
          },
          create: {
            name: "recherche et developpement",
          },
        },
      },
    },
    {
      name: "cybermetrics",
      domain: {
        connectOrCreate: {
          where: {
            name: "recherche et developpement",
          },
          create: {
            name: "recherche et developpement",
          },
        },
      },
    },
    {
      name: "web",
      domain: {
        connectOrCreate: {
          where: {
            name: "recherche et developpement",
          },
          create: {
            name: "recherche et developpement",
          },
        },
      },
    },
    {
      name: "idm,mda",
      domain: {
        connectOrCreate: {
          where: {
            name: "system d'information et multimédia",
          },
          create: {
            name: "system d'information et multimédia",
          },
        },
      },
    },
    {
      name: "web services",
      domain: {
        connectOrCreate: {
          where: {
            name: "system d'information et multimédia",
          },
          create: {
            name: "system d'information et multimédia",
          },
        },
      },
    },
    {
      name: "si avancés",
      domain: {
        connectOrCreate: {
          where: {
            name: "system d'information et multimédia",
          },
          create: {
            name: "system d'information et multimédia",
          },
        },
      },
    },
    {
      name: "documents multimédia",
      domain: {
        connectOrCreate: {
          where: {
            name: "system d'information et multimédia",
          },
          create: {
            name: "system d'information et multimédia",
          },
        },
      },
    },
  ];
  await createComp(competences[0]);
  await createComp(competences[1]);
  await createComp(competences[2]);
  await createComp(competences[3]);
  await createComp(competences[4]);
  await createComp(competences[5]);
  await createComp(competences[6]);
  await createComp(competences[7]);
  await createComp(competences[8]);
  await createComp(competences[9]);
  await createComp(competences[10]);
  await createComp(competences[11]);
  await createComp(competences[12]);
  await createComp(competences[13]);
  await createComp(competences[14]);
  await createComp(competences[15]);
};

//@ts-ignore
let createComp = async (data) => {
  await prisma.competence.create({ data });
};

let createAdmin = async () => {
  await prisma.user.create({
    data: {
      firstName: "adel",
      lastName: "adel",
      username: "adel",
      password: await hash("adeladel", 4),
      email: "adel@gmail.com",
      equipe: 1,
      isAdmin: true,
      domain: {
        connect: {
          name: "dtisi",
        },
      },
      competences: {
        connect: [{ name: "big data" }],
      },
    },
  });
};

main().finally(() => prisma.$disconnect());
