/**
 * Strips HTML tags from all string values in req.body recursively.
 * Lightweight XSS prevention without external dependency.
 */
const stripTags = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripTags);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, stripTags(v)])
    );
  }
  return value;
};

const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = stripTags(req.body);
  }
  next();
};

export default sanitize;
