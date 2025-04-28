const format = require("pg-format");
const db = require("../connection");
const { convertTimestampToDate, createRef } = require("./utils");

const seed = ({ collectionData, userData, artworkData, exhibitionData }) => {
  return db
    .query(`DROP TABLE IF EXISTS exhibition_artworks;`)
    .then(() => db.query(`DROP TABLE IF EXISTS exhibitions;`))
    .then(() => db.query(`DROP TABLE IF EXISTS artworks;`))
    .then(() => db.query(`DROP TABLE IF EXISTS users;`))
    .then(() => db.query(`DROP TABLE IF EXISTS collections;`))
    .then(() => {
      return Promise.all([
        db.query(`
          CREATE TABLE collections (
            slug VARCHAR PRIMARY KEY,
            description VARCHAR
          );`),
        db.query(`
          CREATE TABLE users (
            username VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            avatar_url VARCHAR
          );`),
      ]);
    })
    .then(() => {
      return db.query(`
        CREATE TABLE artworks (
          artwork_id SERIAL PRIMARY KEY,
          title VARCHAR NOT NULL,
          collection VARCHAR NOT NULL REFERENCES collections(slug),
          artist VARCHAR NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          size VARCHAR,
          location TEXT,
          artwork_img_url VARCHAR
        );
      `);
    })
    .then(() => {
      return db.query(`
        CREATE TABLE exhibitions (
          exhibition_id SERIAL PRIMARY KEY,
          user_id VARCHAR REFERENCES users(username),
          title VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    })
    .then(() => {
      return db.query(`
        CREATE TABLE exhibition_artworks (
          exhibition_artwork_id SERIAL PRIMARY KEY,
          exhibition_id INT REFERENCES exhibitions(exhibition_id),
          artwork_id INT REFERENCES artworks(artwork_id)
        );
      `);
    })
    .then(() => {
      return db.query(`
        ALTER TABLE exhibition_artworks
        ADD CONSTRAINT unique_exhibition_artwork UNIQUE (exhibition_id, artwork_id);
      `);
    })
    .then(() => {
      const collectionsInsert = format(
        "INSERT INTO collections (slug, description) VALUES %L;",
        collectionData.map(({ slug, description }) => [slug, description])
      );

      const usersInsert = format(
        "INSERT INTO users (username, name, avatar_url) VALUES %L;",
        userData.map(({ username, name, avatar_url }) => [
          username,
          name,
          avatar_url,
        ])
      );

      return Promise.all([db.query(collectionsInsert), db.query(usersInsert)]);
    })
    .then(() => {
      const formattedArtworkData = artworkData.map(convertTimestampToDate);
      const artworkInsert = format(
        `INSERT INTO artworks
           (title, collection, artist, description, created_at, size, location, artwork_img_url)
           VALUES %L RETURNING *;`,
        formattedArtworkData.map(
          ({
            title,
            collection,
            artist,
            description,
            created_at,
            size,
            location,
            artwork_img_url,
          }) => [
            title,
            collection,
            artist,
            description,
            created_at,
            size,
            location,
            artwork_img_url,
          ]
        )
      );
      return db.query(artworkInsert);
    })
    .then(({ rows: artworkRows }) => {
      const exhibitionsInsert = format(
        `INSERT INTO exhibitions (user_id, title, created_at) VALUES %L RETURNING *;`,
        exhibitionData.map(({ user_id, title, created_at }) => [
          user_id,
          title,
          created_at,
        ])
      );

      return db.query(exhibitionsInsert).then(({ rows: exhibitionRows }) => {
        const joinData = [];

        artworkRows.forEach((artwork, index) => {
          const exhibition = exhibitionRows[index % exhibitionRows.length];
          joinData.push([exhibition.exhibition_id, artwork.artwork_id]);
        });

        console.log("Joining exhibitions with artworks:", joinData);

        const exhibitionArtworksInsert = format(
          `INSERT INTO exhibition_artworks (exhibition_id, artwork_id) VALUES %L;`,
          joinData
        );

        return db.query(exhibitionArtworksInsert);
      });
    });
};

module.exports = seed;
