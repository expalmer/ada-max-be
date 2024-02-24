const { z } = require("zod");

const signInSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const idSchema = z.object({
  id: z.string({
    required_error: "ID é obrigatório",
  }),
});

const profileSchema = z.object({
  body: z.object({
    avatarId: z.number(),
    name: z.string().min(1),
    color: z.enum(["1", "2", "3", "4", "5"]),
  }),
});

module.exports = {
  signInSchema,
  idSchema,
  profileSchema,
};
