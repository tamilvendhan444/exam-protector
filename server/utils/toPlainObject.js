export function toPlainObject(doc) {
  if (!doc) return doc;
  return typeof doc.toObject === 'function' ? doc.toObject() : (doc._doc || doc);
}
