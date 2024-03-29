export function deleteUndefinedProperties(object: any) {
  // Delete undefined properties
  if (object) {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        if (typeof object[key] === "undefined") {
          delete object[key];
        }
      }
    }
  }
  return object;
}
