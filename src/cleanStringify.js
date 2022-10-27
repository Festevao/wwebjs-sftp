module.exports = function (object, replacer, space) {
  if (object && typeof object === 'object') {
    object = copyWithoutCircularReferences([object], object);
  }
  return JSON.stringify(object, replacer, space);
};

function copyWithoutCircularReferences(references, object) {
  var cleanObject = {};
  Object.keys(object).forEach(function (key) {
    var value = object[key];
    if (value && typeof value === 'object') {
      if (references.indexOf(value) < 0) {
        references.push(value);
        cleanObject[key] = copyWithoutCircularReferences(references, value);
        references.pop();
      } else {
        cleanObject[key] = '[Circular]';
      }
    } else if (typeof value !== 'function') {
      cleanObject[key] = value;
    }
  });
  return cleanObject;
}