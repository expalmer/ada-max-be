const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { validate, auth } = require("./middlewares");
const { signInSchema, profileSchema, idSchema } = require("./schemas");
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
    const { email, password } = req.body;
    const user = await pg
      .select("*")
      .from("User")
      .where("email", email)
      .where("password", password)
      .first();

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isAdmin = email === "adamax@adamax.com";

    const token = await getToken(user.id, user.name, user.email, isAdmin);

    res.json({ token });
    return;
  } catch (error) {
    next(error);
  }
});

app.get("/api/avatar", auth, async (_req, res, next) => {
  try {
    const data = await pg.select("*").from("Avatar");
    const groupedByKey = data.reduce((acc, { group, ...item }) => {
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {});

    const groups = Object.entries(groupedByKey).map(([key, items]) => {
      return {
        name: key,
        items,
      };
    });

    return res.json(groups);
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

    const avatars = await pg.select("*").from("Avatar");

    const response = data.map((profile) => {
      const avatar = avatars.find((a) => a.id === profile.avatarId);
      return {
        id: profile.id,
        name: profile.name,
        avatar,
      };
    });

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile/:id", auth, async (req, res, next) => {
  try {
    const data = await pg
      .select("*")
      .from("Profile")
      .where("id", req.params.id)
      .first();

    if (!data) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const avatar = await pg
      .select("*")
      .from("Avatar")
      .where("id", data.avatarId)
      .first();

    return res.json({
      id: data.id,
      name: data.name,
      avatar,
    });
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

      return res.status(204).send();
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

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/banners", async (req, res, next) => {
  try {
    const data = await pg
      .select(
        "Movie.id",
        "Movie.title",
        "Banner.description",
        "Movie.imageTitle"
      )
      .from("Banner")
      .leftJoin("Movie", "Banner.movieId", "Movie.id")
      .orderBy("order", "asc");

    if (!data) {
      return res.json([]);
    }

    const banners = data.map((item) => {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        headline: `/images/movies/${item.imageTitle}-title.webp`,
        video: `/images/movies/${item.imageTitle}-video.mp4`,
        image: `/images/movies/${item.imageTitle}-image.webp`,
        link: `/movie/${item.id}`,
      };
    });

    return res.json(banners);
  } catch (error) {
    next(error);
  }
});

const offersData = [
  {
    id: 1,
    title: "The Best of 2020",
    offers: [1, 3, 4, 5, 6, 7],
  },
  {
    id: 2,
    title: "Streaming only on Ada Max",
    offers: [6, 7, 8, 9, 10, 4],
  },
  {
    id: 3,
    title: "Watch it again",
    offers: [8, 1, 4, 3, 5, 10],
  },
  {
    id: 4,
    title: "Top 10 in US Today",
    offers: [10, 9, 8, 7, 3, 1],
  },
];
app.get("/api/trail-offers", async (req, res, next) => {
  const data = offersData.map((item) => ({
    offerId: item.id,
    title: item.title,
  }));

  return res.json(data);
});

app.get("/api/trail-offers/:id", async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  const offer = offersData.find((item) => item.id === id);

  if (!offer) {
    return res.status(404).json({ message: "Offer not found" });
  }

  const movies = await pg.select("*").from("Movie");

  const data = {
    offerId: id,
    title: offer.title,
    offers: offer.offers.map((offerId) => {
      const movie = movies.find((m) => m.id === offerId);
      return {
        id: movie.id,
        title: movie.title,
        image: `/images/movies/${movie.imageTitle}-h.webp`,
        link: `/movie/${movie.id}`,
      };
    }),
  };

  return res.json(data);
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
