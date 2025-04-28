exports.convertTimestampToDate = ({ created_at, ...otherProperties }) => {
  let parsedDate;

  if (created_at) {
    const timestamp = Number(created_at);

    if (!isNaN(timestamp)) {
      parsedDate =
        timestamp > 1e12 || timestamp < 0
          ? new Date("2000-01-01T00:00:00.000Z")
          : new Date(timestamp);
    } else if (
      typeof created_at === "string" &&
      !isNaN(Date.parse(created_at))
    ) {
      parsedDate = new Date(created_at);
    } else {
      parsedDate = new Date("2000-01-01T00:00:00.000Z");
    }

    if (isNaN(parsedDate.getTime())) {
      console.log("Timestamp out of range, fallback:", created_at);
      parsedDate = new Date("2000-01-01T00:00:00.000Z");
    }
  } else {
    parsedDate = new Date("2000-01-01T00:00:00.000Z");
  }

  return {
    created_at: parsedDate,
    ...otherProperties,
  };
};

exports.createRef = (arr, key, value) => {
  return arr.reduce((ref, element) => {
    ref[element[key]] = element[value];
    return ref;
  }, {});
};

const getEuropeanaCollectionType = (item) => {
  const type = (item.type || "").toLowerCase();

  if (type.includes("image")) {
    const format = (item.format || "").toLowerCase();
    if (format.includes("photo") || format.includes("photograph")) {
      return "photography";
    }
    if (format.includes("painting")) {
      return "painting";
    }
    return "painting";
  }

  if (type.includes("text")) return "manuscript";
  if (type.includes("3d")) return "sculpture";
  if (type.includes("physical")) return "installation";

  return "misc";
};

const getRijksmuseumCollectionType = (item) => {
  const objectType = (item.objectTypes?.[0] || "").toLowerCase();

  if (objectType.includes("painting")) return "painting";
  if (objectType.includes("photograph")) return "photography";
  if (objectType.includes("sculpture")) return "sculpture";
  if (objectType.includes("installation")) return "installation";
  if (objectType.includes("manuscript") || objectType.includes("text"))
    return "manuscript";

  return "misc";
};

const extractSizeFromDescription = (descriptionArr = []) => {
  const regex =
    /(\d{1,4}\s?[×xX*]\s?\d{1,4}\s?(cm|mm|in|inch|inches))|((height|width|depth):?\s?\d+\s?(cm|mm|in|inch|inches))/gi;

  for (const desc of descriptionArr) {
    const match = desc.match(regex);
    if (match && match.length > 0) {
      return match.join("; ");
    }
  }
  return null;
};

exports.normalizeEuropeanaItem = (item) => {
  return {
    title: item.title?.[0] || "Untitled",
    artist: item.dcCreator?.[0] || "Unknown",
    description: item.dcDescription?.[0] || "No description available",
    collection: getEuropeanaCollectionType(item),
    created_at: item.timestamp_created || Date.now(),
    artwork_img_url: item.edmPreview?.[0] || null,
    size: extractSizeFromDescription(item.dcDescription),
    location: item.dataProvider || "Europeana",
  };
};

exports.normalizeRijksmuseumItem = (item) => {
  const year = item.dating?.year;
  let dateString = null;

  if (year && typeof year === "number" && year > 0 && year < 3000) {
    dateString = `${year}-01-01T00:00:00.000Z`;
  }

  return {
    title: item.title || "Untitled",
    artist: item.principalOrFirstMaker || "Unknown",
    description: item.longTitle || "No description available",
    collection: getRijksmuseumCollectionType(item),
    created_at: dateString || new Date().toISOString(),
    artwork_img_url: item.webImage?.url || null,
    size: item.dimensions
      ? item.dimensions.map((d) => d.value).join(", ")
      : null,
    location: item.location || "Rijksmuseum",
  };
};
