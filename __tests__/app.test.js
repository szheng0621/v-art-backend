const app = require("../app.js");
const request = require("supertest");
const db = require("../db/connection.js");
const seed = require("../db/seeds/fetchAndSeed.js");
const data = require("../db/data/test-data");
const endpoints = require("../endpoints.json");

beforeEach(() => seed(data));
afterAll(() => db.end());

describe("/api", () => {
  test("GET: 200 - responds with an object detailing all available endpoints", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body.endpoints).toEqual(endpoints);
      });
  });
});

describe("/api/collections", () => {
  test("GET 200 - Responds with an array of objects which has two properties slug and decscription", () => {
    return request(app)
      .get("/api/collections")
      .expect(200)
      .then(({ body }) => {
        expect(body.collections.length).toBe(6);
        console.log("body collections", body.collections);
        body.collections.forEach((collection) => {
          expect(typeof collection.slug).toBe("string");
          expect(typeof collection.description).toBe("string");
        });
      });
  });
});

describe("*", () => {
  test("ALL - 404 responds with an arror message when a request is made to a path which does not exist ", () => {
    return request(app)
      .get("/api/nonexistent-path")
      .expect(404)
      .then(({ body }) => {
        console.log(">>> 404 body:", body);
        expect(body.msg).toBe("path not found");
      });
  });
});

describe("/api/artworks/:artwork_id", () => {
  test("GET-200 responds with an artwork object", () => {
    return request(app)
      .get("/api/artworks/7")
      .expect(200)
      .then(({ body }) => {
        expect(body.artwork.artwork_id).toBe(7);
        expect(body.artwork.title).toEqual(expect.any(String));
        expect(body.artwork.collection).toEqual(expect.any(String));
        expect(body.artwork.artist).toEqual(expect.any(String));
        expect(body.artwork.description).toSatisfy(
          (val) => typeof val === "string" || val === null
        );
        expect(body.artwork.created_at).toEqual(expect.any(String));
        expect(body.artwork.size).toSatisfy(
          (val) => typeof val === "string" || val === null
        );
        expect(body.artwork.location).toEqual(expect.any(String));
        expect(body.artwork.artwork_img_url).toEqual(expect.any(String));
      });
  });
});

test("400 - responds with bad request ", () => {
  return request(app)
    .get("/api/artworks/not_a_number")
    .expect(400)
    .then(({ body }) => {
      expect(body.msg).toBe("bad request");
    });
});

test("404 - responds with article not found ", () => {
  return request(app)
    .get("/api/artworks/88")
    .expect(404)
    .then(({ body }) => {
      expect(body.msg).toBe("not found");
    });
});

describe("/api/artworks", () => {
  test("GET- 200 artworks are ordered by sorted by date in descending order", () => {
    return request(app)
      .get("/api/artworks")
      .expect(200)
      .then(({ body }) => {
        expect(body.artworks).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });

  test("GET-200, a query sorted by title and order by acsending", () => {
    return request(app)
      .get("/api/artworks?sort_by=title&order=asc")
      .expect(200)
      .then(({ body }) => {
        expect(body.artworks).toBeSortedBy("title", {
          ascending: true,
        });
      });
  });

  test("GET - 200 responds with paginated artworks and total count", () => {
    return request(app)
      .get(
        "/api/artworks?page=1&limit=5&sort_by=title&order=asc&collection=painting"
      )
      .expect(200)
      .then(({ body }) => {
        expect(body.current_page).toBe(1);
        expect(body.artworks.length).toBeLessThanOrEqual(5);
        expect(body.total_count).toBeGreaterThanOrEqual(0);
        const totalPages = Math.ceil(body.total_count / 5);
        expect(body.total_pages).toBe(totalPages);
        body.artworks.forEach((artwork) => {
          expect(artwork.collection).toBe("painting");
        });
      });
  });

  test("GET - 400, responds with an error when collection has empty value", () => {
    return request(app)
      .get("/api/artworks?collection=")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("bad request");
      });
  });

  test("GET - 404, responds with an error when collection value does not exist", () => {
    return request(app)
      .get("/api/artworks?collection=dogs")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("not found");
      });
  });

  test("GET - 200, valid collection but no associated artworks responds with an empty array", () => {
    return request(app)
      .get("/api/artworks?collection=manuscript")
      .expect(200)
      .then(({ body }) => {
        expect(body.artworks).toEqual([]);
      });
  });
});

describe("/api/users/:username/exhibitions", () => {
  test("GET 200 - returns exhibitions for valid user", () => {
    return request(app)
      .get("/api/users/tickle122/exhibitions")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.exhibitions)).toBe(true);
      });
  });

  test("404 - responds with user not found with an appropriate error message when given an invalid user name which does not exist in the list", () => {
    return request(app)
      .get("/api/users/johndoe/exhibitions")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("User not found");
      });
  });

  test("200 - responds with empty array for the given username that is present but has no associated exhibitions", () => {
    return request(app)
      .get("/api/users/lonely_artist/exhibitions")
      .expect(200)
      .then(({ body }) => {
        expect(body.exhibitions).toBeInstanceOf(Array);
        expect(body.exhibitions).toHaveLength(0);
      });
  });

  test("200 - responds with only grouped by painting artworks, ordered by artwork_id asc", () => {
    return request(app)
      .get("/api/users/tickle122/exhibitions?collection=painting")
      .expect(200)
      .then(({ body }) => {
        expect(body.groupedArtworks).toBeInstanceOf(Array);
        expect(body.groupedArtworks).toHaveLength(1);
        expect(body.groupedArtworks[0].collection).toBe("painting");
        expect(body.groupedArtworks[0].artworks).toBeInstanceOf(Array);
        expect(body.groupedArtworks[0].artworks).toHaveLength(2);
      });
  });

  test("200 - responds with only grouped by painting artworks, ordered by title descending", () => {
    return request(app)
      .get(
        "/api/users/tickle122/exhibitions?collection=painting&sort_by=title&order=desc"
      )
      .expect(200)
      .then(({ body }) => {
        expect(body.groupedArtworks).toBeInstanceOf(Array);
        expect(body.groupedArtworks).toHaveLength(1);
        expect(body.groupedArtworks[0].collection).toBe("painting");
        expect(body.groupedArtworks[0].artworks).toBeInstanceOf(Array);
        expect(body.groupedArtworks[0].artworks).toHaveLength(2);
        expect(body.groupedArtworks).toBeSortedBy("title", {
          descending: true,
        });
      });
  });
});

describe("/api/exhibitions/:exhibition_id", () => {
  test("GET-200 responds with an valid exhibition_id", () => {
    return request(app)
      .get("/api/exhibitions/4")
      .expect(200)
      .then(({ body }) => {
        expect(body.exhibition.user_id).toEqual(expect.any(String));
        expect(body.exhibition.title).toEqual(expect.any(String));
        expect(body.exhibition.created_at).toEqual(expect.any(String));
      });
  });

  test("404 - responds with exhibition not found with an valid number but does not exist", () => {
    return request(app)
      .get("/api/exhibitions/999")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Exhibition not found");
      });
  });
});

describe("/api/exhibitions/:exhibition_id/artworks", () => {
  test("GET - 200 responds an array of artworks for the given exhibition_id", () => {
    return request(app)
      .get("/api/exhibitions/1/artworks")
      .expect(200)
      .then(({ body }) => {
        expect(body.artworks).toBeInstanceOf(Array);
        expect(body.artworks.length).toBe(3);
        body.artworks.forEach((artwork) => {
          expect(artwork).toHaveProperty("title");
          expect(artwork).toHaveProperty("artist");
          expect(artwork).toHaveProperty("collection");
          expect(artwork).toHaveProperty("description");
          expect(artwork).toHaveProperty("artwork_img_url");
          expect(artwork.exhibition_id).toBe(1);
        });
      });
  });

  test("GET- 200 artworks are served with the most recent artworks first", () => {
    return request(app)
      .get("/api/exhibitions/1/artworks")
      .expect(200)
      .then(({ body }) => {
        expect(body.artworks).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });

  test("404 - responds with artwork not found by searching exhibition id which does not exist in the list", () => {
    return request(app)
      .get("/api/exhibitions/999/artworks")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Exhibition not found");
      });
  });

  test("200 - responds with empty array for the given exhibition_id that is present but has no associated artworks", () => {
    return db
      .query(
        `INSERT INTO exhibitions (user_id, title, created_at)
         VALUES ($1, $2, $3)
         RETURNING exhibition_id;`,
        ["tickle122", "Test Exhibition No Artworks", new Date("2025-01-01")]
      )
      .then(({ rows }) => {
        const newExhibitionId = rows[0].exhibition_id;

        return request(app)
          .get(`/api/exhibitions/${newExhibitionId}/artworks`)
          .expect(200);
      })
      .then(({ body }) => {
        expect(body.artworks).toBeInstanceOf(Array);
        expect(body.artworks).toHaveLength(0);
      });
  });

  test("POST 201 - successfully adds artwork_id: 5 to exhibition_id: 2", () => {
    return request(app)
      .post("/api/exhibitions/2/artworks")
      .send({ artwork_id: 5 })
      .expect(201)
      .then(({ body }) => {
        expect(body).toHaveProperty("addedArtwork");
        expect(body.addedArtwork).toHaveProperty("exhibition_id", 2);
        expect(body.addedArtwork).toHaveProperty("artwork_id", 5);
      });
  });

  test("POST 409 - cannot add duplicate artwork to the same exhibition", () => {
    return request(app)
      .post("/api/exhibitions/2/artworks")
      .send({ artwork_id: 8 })
      .expect(409)
      .then(({ body }) => {
        expect(body.msg).toBe("Artwork already exists in this exhibition");
      });
  });
});

describe("/api/users/:username/exhibitions/:exhibition_id/artworks", () => {
  test("GET 200 - returns an exhibition with nested artworks for valid user", () => {
    return request(app)
      .get("/api/users/tickle122/exhibitions/1/artworks")
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveProperty("exhibitions");
        expect(Array.isArray(body.exhibitions)).toBe(true);
        expect(body.exhibitions.length).toBe(1);

        const exhibition = body.exhibitions[0];
        expect(exhibition).toHaveProperty("exhibition_id", 1);
        expect(exhibition).toHaveProperty("user_id", "tickle122");
        expect(exhibition).toHaveProperty("title");
        expect(exhibition).toHaveProperty("created_at");
        expect(exhibition).toHaveProperty("artworks");
        expect(Array.isArray(exhibition.artworks)).toBe(true);
        if (exhibition.artworks.length > 0) {
          const artwork = exhibition.artworks[0];
          expect(artwork).toHaveProperty("artwork_id");
          expect(artwork).toHaveProperty("title");
          expect(artwork).toHaveProperty("artist");
          expect(artwork).toHaveProperty("collection");
          expect(artwork).toHaveProperty("description");
          expect(artwork).toHaveProperty("created_at");
          expect(artwork).toHaveProperty("artwork_img_url");
        }
      });
  });

  test("GET 404 - returns not found if exhibition doesn't exist", () => {
    return request(app)
      .get("/api/users/tickle122/exhibitions/999/artworks")
      .expect(404)
      .then(({ body }) => {
        expect(body).toHaveProperty("msg", "Exhibition not found");
      });
  });

  test("GET 403 - returns forbidden if user doesn't own the exhibition", () => {
    return request(app)
      .get("/api/users/lonely_artist/exhibitions/1/artworks")
      .expect(403)
      .then(({ body }) => {
        expect(body).toHaveProperty("msg", "Forbidden - not your exhibition");
      });
  });

  test("POST 201 - successfully adds artwork_id: 5 to exhibition_id: 1 with an associated username ", () => {
    return request(app)
      .post("/api/users/tickle122/exhibitions/1/artworks")
      .send({ artwork_id: 3 })
      .expect(201)
      .then(({ body }) => {
        expect(body).toHaveProperty("addedArtwork");
        expect(body.addedArtwork).toHaveProperty("exhibition_id", 1);
        expect(body.addedArtwork).toHaveProperty("artwork_id", 3);
      });
  });

  test("POST 409 - the user cannot add duplicate artwork to the same exhibition", () => {
    return request(app)
      .post("/api/users/tickle122/exhibitions/1/artworks")
      .send({ artwork_id: 1 })
      .expect(409)
      .then(({ body }) => {
        expect(body.msg).toBe("Artwork already exists in this exhibition");
      });
  });

  test("DELETE: 204 - deletes the specified artwork and responds with empty body ", () => {
    return request(app)
      .delete("/api/users/tickle122/exhibitions/1/artworks/1")
      .expect(204);
  });

  test("DELETE: 403 - only the owner can delete artwork from an exhibition", () => {
    return request(app)
      .delete("/api/users/lonely_artist/exhibitions/1/artworks/1")
      .expect(403)
      .then(({ body }) => {
        expect(body.msg).toBe("Forbidden - not your exhibition");
      });
  });
});

// describe.only("GET /api/artworks?search=", () => {
//   test("200: responds with artworks matching the search term (case-insensitive partial match)", () => {
//     return request(app)
//     .get("/api/artworks?search=painitng")
//     .expect(200)
//     .then(({ body }) => {
//     expect(Array.isArray(body.artworks)).toBe(true);
//     expect(artwork.title.toLowerCase()).toContain("painitng");
//     })
//   });
// })