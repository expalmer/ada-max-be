const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { validate, auth } = require("./middlewares");
const { signInSchema, profileSchema } = require("./schemas");
const { getToken } = require("./utils/auth");

const pg = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
  searchPath: ["public"],
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/api/", (_req, res) => {
  res.json({ message: "Ada Max is alive" });
});

app.post("/api/signIn", validate(signInSchema), async (req, res, next) => {
  try {
    const user = await pg
      .select("*")
      .from("User")
      .where("email", req.body.email)
      .where("password", req.body.password)
      .first();

    const token = await getToken(user.id, user.name, user.email);

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

app.get("/api/avatar", auth, async (_req, res, next) => {
  try {
    const data = await pg.select("*").from("Avatar");
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile", auth, async (req, res, next) => {
  try {
    const data = await pg
      .select("*")
      .from("Profile")
      .where("userId", req.user.id);

    return res.json(data);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/profile",
  auth,
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const item = {
        userId: req.user.id,
        avatarId: req.body.avatarId,
        name: req.body.name,
        color: req.body.color,
      };

      const data = await pg.insert(item).into("Profile").returning("*");

      return res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

app.put(
  "/api/profile/:id",
  auth,
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const item = {
        userId: req.user.id,
        avatarId: req.body.avatarId,
        name: req.body.name,
        color: req.body.color,
      };

      const data = await pg
        .update(item)
        .into("Profile")
        .where("id", req.params.id)
        .where("userId", req.user.id)
        .returning("*");

      if (!data.length) {
        return res.status(404).json({ message: "Profile not found" });
      }

      return res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

app.delete("/api/profile/:id", auth, async (req, res, next) => {
  try {
    const data = await pg
      .delete()
      .into("Profile")
      .where("id", req.params.id)
      .where("userId", req.user.id);

    if (!data) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json(data);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ message: "Page Not Found" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(9000, () => {
    console.log("Server is running on port 9000");
  });
}

module.exports = app;
