const express = require("express");
const app = express();
const endpoints = require("./endpoints.json");
const {
  getCollections,
  getArtworkById,
  getArtworks,
  getExhibitionsByUsername,
  getExhibitionsById,
  getArtworkByExhibitionId,
  getArtworksByUserAndExhibition,
  postArtworkToExhibition,
  postArtworkToUserExhibition,
  deleteUserArtworkById,
} = require("./controllers/artworks_controllers.js");
// const cors = require("cors");

app.use(express.json());

// app.use(cors());

app.get("/api", (request, response) => {
  response.status(200).send({ endpoints: endpoints });
});

app.get("/api/collections", getCollections);

app.get("/api/artworks/:artwork_id", getArtworkById);

app.get("/api/artworks", getArtworks);

app.get("/api/users/:username/exhibitions", getExhibitionsByUsername);

app.get("/api/exhibitions/:exhibition_id", getExhibitionsById);

app.get("/api/exhibitions/:exhibition_id/artworks", getArtworkByExhibitionId);

app.get(
  "/api/users/:username/exhibitions/:exhibition_id/artworks",
  getArtworksByUserAndExhibition
);

app.post("/api/exhibitions/:exhibition_id/artworks", postArtworkToExhibition);

app.post(
  "/api/users/:username/exhibitions/:exhibition_id/artworks",
  postArtworkToUserExhibition
);

app.delete(
  "/api/users/:username/exhibitions/:exhibition_id/artworks/:artwork_id",
  deleteUserArtworkById
);

app.use((req, res) => {
  res.status(404).send({ msg: "path not found" });
});

app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({ msg: err.msg });
  } else {
    res.status(500).send({ msg: "Internal server Error" });
  }
});

module.exports = app;
