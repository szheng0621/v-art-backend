function getEuropeanaCollectionType(item) {
    const type = item.type?.toLowerCase() || "";
  
    if (type.includes("image")) {
      const desc = (item.dcDescription?.[0] || "").toLowerCase();
      if (desc.includes("photo")) return "photography";
      if (desc.includes("painting") || desc.includes("watercolor")) return "painting";
      return "misc";
    }
    if (type.includes("text")) return "manuscript";
    if (type.includes("sound") || type.includes("video")) return "misc";
    if (type.includes("3d") || type.includes("physical")) return "sculpture";
  
    return "misc";
  }
  
  function getRijksmuseumCollectionType(item) {
    const objectType = item.objectTypes?.[0]?.toLowerCase() || "";
  
    if (objectType.includes("painting")) return "painting";
    if (objectType.includes("sculpture") || objectType.includes("statue")) return "sculpture";
    if (objectType.includes("installation")) return "installation";
    if (objectType.includes("manuscript") || objectType.includes("book")) return "manuscript";
    if (objectType.includes("photograph") || objectType.includes("photo")) return "photography";
  
    return "misc";
  }
  