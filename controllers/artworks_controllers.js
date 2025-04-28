const {
  fetchCollections,
  fetchArtworkById,
  fetchArtworks,
  fetchUserByUsername,
  fetchExhibitionsByUsername,
  fetchExhibitionByExhibitionId,
  fetchArtworkByExhibitionId,
  fetchArtworksForExhibitions,
  postArtworkByExhibitionId,
  addArtworkToUserExhibition,
  removeArtworkById,
  fetchArtworksGroupedByCollection,
} = require("../models/artworks_models.js");

exports.getCollections = (request, response, next) => {
  return fetchCollections()
    .then((collections) => {
      response.status(200).send({ collections });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getArtworkById = (request, response, next) => {
  const { artwork_id } = request.params;
  if (isNaN(Number(artwork_id))) {
    return next({ status: 400, msg: "bad request" });
  }
  return fetchArtworkById(artwork_id)
    .then((artwork) => {
      response.status(200).send({ artwork });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getArtworks = (request, response, next) => {
  const { sort_by, order, collection, page = 1, limit = 10 } = request.query;

  Promise.all([
    fetchCollections(),
    fetchArtworks(sort_by, order, collection, page, limit),
  ])
    .then(
      ([collections, { artworks, total_count, total_pages, current_page }]) => {
        const validCollections = collections.map(
          (collection) => collection.slug
        );

        if (collection && !validCollections.includes(collection)) {
          return Promise.reject({ status: 404, msg: "not found" });
        }

        response
          .status(200)
          .send({ artworks, total_count, total_pages, current_page });
      }
    )
    .catch((err) => {
      next(err);
    });
};

exports.getExhibitionsByUsername = (request, response, next) => {
  const { username } = request.params;
  const { group_by, collection, sort_by, order } = request.query;

  fetchUserByUsername(username)
    .then(() => {
      return Promise.all([
        fetchExhibitionsByUsername(username),
        fetchArtworksGroupedByCollection(username, collection, sort_by, order),
      ]);
    })
    .then(([exhibitions, groupedArtworks]) => {
      response.status(200).send({
        exhibitions,
        groupedArtworks,
      });
    })
    .catch(next);
};

exports.getExhibitionsById = (request, response, next) => {
  const { exhibition_id } = request.params;
  if (isNaN(Number(exhibition_id))) {
    return next({ status: 400, msg: "bad request" });
  }
  return fetchExhibitionByExhibitionId(exhibition_id)
    .then((exhibition) => {
      response.status(200).send({ exhibition });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getArtworkByExhibitionId = (request, response, next) => {
  const { exhibition_id } = request.params;
  console.log("Received request for exhibition_id:", exhibition_id);

  fetchExhibitionByExhibitionId(exhibition_id)
    .then(() => {
      console.log("Exhibition exists, fetching artworks...");
      return fetchArtworkByExhibitionId(exhibition_id);
    })
    .then((artworks) => {
      console.log("Artworks found:", artworks.length);
      response.status(200).send({ artworks });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getArtworksByUserAndExhibition = (request, response, next) => {
  const { username, exhibition_id } = request.params;

  fetchExhibitionByExhibitionId(exhibition_id)
    .then((exhibition) => {
      if (!exhibition) {
        return Promise.reject({ status: 404, msg: "Exhibition not found" });
      }
      if (exhibition.user_id !== username) {
        return Promise.reject({
          status: 403,
          msg: "Forbidden - not your exhibition",
        });
      }
      return fetchArtworkByExhibitionId(exhibition_id).then((artworks) => {
        exhibition.artworks = artworks;
        return response.status(200).send({ exhibitions: [exhibition] });
      });
    })
    .catch(next);
};

exports.postArtworkToExhibition = (request, response, next) => {
  const { exhibition_id } = request.params;
  const { artwork_id } = request.body;
  if (!artwork_id) {
    return res.status(400).send({ msg: "artwork_id is required" });
  }
  return fetchExhibitionByExhibitionId(exhibition_id)
    .then(() => {
      return fetchArtworkById(artwork_id);
    })
    .then(() => {
      return postArtworkByExhibitionId(exhibition_id, artwork_id);
    })
    .then((addedArtwork) => {
      response.status(201).send({ addedArtwork });
    })
    .catch(next);
};

exports.postArtworkToUserExhibition = (request, response, next) => {
  const { exhibition_id, username } = request.params;
  const { artwork_id } = request.body;

  if (!artwork_id) {
    return response.status(400).send({ msg: "artwork_id is required" });
  }

  fetchExhibitionByExhibitionId(exhibition_id)
    .then((exhibition) => {
      if (!exhibition) {
        return Promise.reject({ status: 404, msg: "Exhibition not found" });
      }
      if (exhibition.user_id !== username) {
        return Promise.reject({
          status: 403,
          msg: "Forbidden - not your exhibition",
        });
      }
      return addArtworkToUserExhibition(exhibition_id, artwork_id);
    })
    .then((addedArtwork) => {
      response.status(201).send({ addedArtwork });
    })
    .catch(next);
};

exports.deleteUserArtworkById = (request, response, next) => {
  const { username, exhibition_id, artwork_id } = request.params;
  fetchExhibitionByExhibitionId(exhibition_id)
    .then((exhibition) => {
      if (!exhibition) {
        return Promise.reject({ status: 404, msg: "Exhibition not found" });
      }
      if (exhibition.user_id !== username) {
        return Promise.reject({
          status: 403,
          msg: "Forbidden - not your exhibition",
        });
      }
      return removeArtworkById(exhibition_id, artwork_id);
    })
    .then((result) => {
      if (result.rowCount === 0) {
        return Promise.reject({ status: 404, msg: "not found" });
      }
      response.status(204).send();
    })
    .catch((err) => {
      next(err);
    });
};
