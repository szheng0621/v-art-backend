require("dotenv").config();
const axios = require("axios");
const seed = require("./seed");
const { normalizeEuropeanaItem, normalizeRijksmuseumItem } = require("./utils");

const artworksData = require("../data/development-data/artworks");
const collectionsData = require("../data/development-data/collections");
const exhibitionsData = require("../data/development-data/exhibitions");
const usersData = require("../data/development-data/users");

//const isValidDate = (date) => {
// return date instanceof Date && !isNaN(date.getTime());
//};

const fetchRijksmuseumData = async () => {
  const response = await axios.get(
    "https://www.rijksmuseum.nl/api/en/collection",
    {
      params: {
        key: process.env.RIJKS_API_KEY,
        format: "json",
        ps: 20,
      },
    }
  );
  return response.data.artObjects.map(normalizeRijksmuseumItem);
};

const fetchEuropeanaData = async () => {
  const response = await axios.get(
    "https://api.europeana.eu/record/v2/search.json",
    {
      params: {
        wskey: process.env.EUROPEANA_API_KEY,
        query: "painting",
        rows: 20,
      },
    }
  );
  return response.data.items.map(normalizeEuropeanaItem);
};

const fetchAndSeed = async () => {
  try {
    const [rijksData, europeanaData] = await Promise.all([
      fetchRijksmuseumData(),
      fetchEuropeanaData(),
    ]);

    const allArtworkData = [
      ...artworksData.slice(0, 5),
      ...rijksData.slice(0, 5),
      ...europeanaData.slice(0, 5),
    ];

    console.log(">>> All artwork to seed:", allArtworkData.length);

    allArtworkData.forEach((item, i) => {
      const asDate = new Date(item.created_at);
      if (!(asDate instanceof Date) || isNaN(asDate)) {
        console.error(`Index ${i} has invalid created_at:`, item.created_at);
      }
    });

    await seed({
      collectionData: collectionsData,
      userData: usersData,
      exhibitionData: exhibitionsData,
      artworkData: allArtworkData,
    });

    console.log("Database seeded with external API data.");
    return;
  } catch (err) {
    console.error("Error seeding database:", err);
    throw err;
  }
};

module.exports = fetchAndSeed;
