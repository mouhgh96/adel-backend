import { createTransport } from "nodemailer";

export let smtpClient = createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "5be00d2b481b17",
    pass: "dbefb71070c1b4",
  },
});
