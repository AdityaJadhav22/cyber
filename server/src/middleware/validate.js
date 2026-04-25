const noSqlPattern = /\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and/i;

const cleanValue = (value) => {
  if (typeof value === "string") return value.trim();
  return value;
};

export const validateInput = (requiredFields = []) => (req, res, next) => {
  const payload = req.body || {};

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return res.status(400).json({ message: `Missing required field: ${field}` });
    }
  }

  for (const [key, rawValue] of Object.entries(payload)) {
    const value = cleanValue(rawValue);

    if (typeof value === "string" && noSqlPattern.test(value)) {
      return res.status(400).json({ message: `Potential injection payload detected in ${key}` });
    }
    if (typeof key === "string" && key.startsWith("$")) {
      return res.status(400).json({ message: "Potential NoSQL injection key detected" });
    }
  }

  next();
};
