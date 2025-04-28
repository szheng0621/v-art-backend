const db = require("../db/connection.js");

exports.fetchCollections = () => {
  return db.query("SELECT * FROM collections;").then((result) => {
    return result.rows;
  });
};

exports.fetchArtworkById = (artwork_id) => {
  return db
    .query(
      `
    SELECT 
      artworks.artwork_id,    
      artworks.title,
      artworks.collection,
      artworks.artist,
      artworks.description,
      artworks.created_at,
      artworks.size,
      artworks.location,
      artworks.artwork_img_url
    FROM artworks
    WHERE artworks.artwork_id = $1
  `,
      [artwork_id]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: "not found" });
      }
      return result.rows[0];
    });
};

exports.fetchArtworks = (
  sort_by = "created_at",
  order = "desc",
  collection,
  page = 1,
  limit = 10
) => {
  const validSortBys = ["created_at", "title", "collection", "location"];
  const validOrderDirects = ["asc", "desc"];

  if (!validSortBys.includes(sort_by)) {
    return Promise.reject({ status: 400, msg: "bad request" });
  }

  if (!validOrderDirects.includes(order)) {
    return Promise.reject({ status: 400, msg: "bad request" });
  }

  if (collection === "") {
    return Promise.reject({ status: 400, msg: "bad request" });
  }

  const offset = (page - 1) * limit;
  const queryValues = [];
  let queryConditions = "";

  if (collection) {
    queryConditions = `WHERE collection = $1`;
    queryValues.push(collection);
  }

  const dataQueryStr = `
    SELECT 
      artworks.artwork_id,    
      artworks.title,
      artworks.collection,
      artworks.artist,
      artworks.description,
      artworks.created_at,
      artworks.size,
      artworks.location,
      artworks.artwork_img_url
    FROM artworks
    ${queryConditions}
    GROUP BY artworks.artwork_id
    ORDER BY ${sort_by} ${order}
    LIMIT $${queryValues.length + 1}
    OFFSET $${queryValues.length + 2};
  `;

  const countQueryStr = `
    SELECT COUNT(*) FROM artworks
    ${queryConditions};
  `;

  const dataQueryValues = [...queryValues, limit, offset];

  return Promise.all([
    db.query(dataQueryStr, dataQueryValues),
    db.query(countQueryStr, queryValues),
  ]).then(([dataResult, countResult]) => {
    const total_count = parseInt(countResult.rows[0].count);
    const total_pages = Math.ceil(total_count / limit);

    return {
      artworks: dataResult.rows,
      total_count,
      total_pages,
      current_page: Number(page),
    };
  });
};

exports.fetchUserByUsername = (username) => {
  return db
    .query("SELECT * FROM users WHERE username = $1;", [username])
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: "User not found" });
      }
      return { user: result.rows[0] };
    });
};

exports.fetchExhibitionsByUsername = (username) => {
  return db
    .query(
      `SELECT * FROM exhibitions WHERE user_id = $1 ORDER BY created_at DESC;`,
      [username]
    )
    .then((result) => result.rows);
};

exports.fetchArtworksGroupedByCollection = (
  username,
  collection,
  sort_by = "artwork_id",
  order = "asc"
) => {
  const validSortFields = ["artwork_id", "title", "artist", "created_at"];
  const validOrders = ["asc", "desc"];

  if (!validSortFields.includes(sort_by)) {
    sort_by = "artwork_id";
  }
  if (!validOrders.includes(order.toLowerCase())) {
    order = "asc";
  }

  const queryValues = [username];
  let queryStr = `
    SELECT 
      artwork.artwork_id, artwork.title, artwork.artist, artwork.artwork_img_url, artwork.collection,
      exhibition.exhibition_id, exhibition.title AS exhibition_title
    FROM exhibition_artworks ea
    JOIN artworks artwork ON ea.artwork_id = artwork.artwork_id
    JOIN exhibitions exhibition ON ea.exhibition_id = exhibition.exhibition_id
    WHERE exhibition.user_id = $1
  `;

  if (collection) {
    queryValues.push(collection);
    queryStr += ` AND artwork.collection = $2`;
  }

  queryStr += ` ORDER BY artwork.${sort_by} ${order.toUpperCase()};`;

  return db.query(queryStr, queryValues).then(({ rows }) => {
    const grouped = [];

    rows.forEach((artwork) => {
      let group = grouped.find((g) => g.collection === artwork.collection);
      if (!group) {
        group = { collection: artwork.collection, artworks: [] };
        grouped.push(group);
      }
      group.artworks.push({
        artwork_id: artwork.artwork_id,
        title: artwork.title,
        artist: artwork.artist,
        artwork_img_url: artwork.artwork_img_url,
        exhibition_id: artwork.exhibition_id,
        exhibition_title: artwork.exhibition_title,
      });
    });

    return grouped;
  });
};

exports.fetchExhibitionByExhibitionId = (exhibition_id) => {
  return db
    .query("SELECT * FROM exhibitions WHERE exhibition_id = $1;", [
      exhibition_id,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Exhibition not found" });
      }
      return result.rows[0];
    });
};

exports.fetchArtworkByExhibitionId = (exhibition_id) => {
  return db
    .query(
      `
      SELECT artworks.*, exhibition_artworks.exhibition_id
      FROM artworks 
      JOIN exhibition_artworks 
      ON artworks.artwork_id = exhibition_artworks.artwork_id 
      WHERE exhibition_artworks.exhibition_id = $1
      ORDER BY artworks.created_at DESC;
      `,
      [exhibition_id]
    )
    .then((result) => {
      return result.rows;
    });
};

exports.postArtworkByExhibitionId = (exhibition_id, artwork_id) => {
  return db
    .query(
      `
      INSERT INTO exhibition_artworks (exhibition_id, artwork_id)
      VALUES ($1, $2)
      RETURNING *;
      `,
      [exhibition_id, artwork_id]
    )
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log("MODEL ERROR:", err);
      if (err.code === "23505") {
        return Promise.reject({
          status: 409,
          msg: "Artwork already exists in this exhibition",
        });
      }
      return Promise.reject(err);
    });
};

exports.addArtworkToUserExhibition = (exhibition_id, artwork_id) => {
  return db
    .query(
      `
      INSERT INTO exhibition_artworks (exhibition_id, artwork_id)
      VALUES ($1, $2)
      RETURNING *;
      `,
      [exhibition_id, artwork_id]
    )
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log("MODEL ERROR:", err);
      if (err.code === "23505") {
        return Promise.reject({
          status: 409,
          msg: "Artwork already exists in this exhibition",
        });
      }
      return Promise.reject(err);
    });
};

exports.removeArtworkById = (exhibition_id, artwork_id) => {
  return db.query(
    "DELETE FROM exhibition_artworks WHERE exhibition_id = $1 AND artwork_id = $2;",
    [exhibition_id, artwork_id]
  );
};
