
/**
 * Expose `isRgbColor`.
 */

module.exports = isRgbColor;


/**
 * RGB(A) color matcher.
 */

var matcher = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d\.]+)?\s*\)$/;


/**
 * Loosely check whether a `string` is an RGB(A) color string.
 *
 * @param {String} string
 * @return {Boolean}
 */

function isRgbColor (string) {
  return matcher.test(string);
}