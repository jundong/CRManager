
/**
 * Expose `isHslColor`.
 */

module.exports = isHslColor;


/**
 * HSL(A) color matcher.
 */

var matcher = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*[\d\.]+)?\s*\)$/;


/**
 * Loosely check whether a `string` is an HSL(A) color string.
 *
 * @param {String} string
 * @return {Boolean}
 */

function isHslColor (string) {
  return matcher.test(string);
}