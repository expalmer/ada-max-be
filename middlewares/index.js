const { AuthError, DefaultError } = require("../errors");

const { ZodError } = require("zod");
const { validateToken } = require("../utils/auth");

const auth = async (req, res, next) => {
  const { authorization = "" } = req.headers;

  if (!authorization) {
    next(new AuthError("Token não informado"));
  }

  const [, token] = authorization.split(" ");

  const payload = await validateToken(token || "");
  console.log({ payload });

  if (!payload) {
    next(new AuthError("Token inválido"));
  }

  req.user = payload?.user;

  return next();
};

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    next(error);
  }
};

const errorHandler = (err, req, res, next) => {
  if (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: err.name,
        errors: err.errors,
      });
    }
    if (err instanceof DefaultError) {
      return res.status(err.code).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Erro interno",
    });
  }

  return next();
};

module.exports = {
  auth,
  validate,
  errorHandler,
};
