/**
 * Lib "all-templates"
 * General Utils
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


/**
 * Deep merge two objects.
 * @param target
 * @param source
 */
function mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
        if ('object' === typeof source[key]) {
            if (! target[key]) {
                Object.assign(target, { [key]: {} });
            }
            mergeDeep(target[key], source[key]);
        } else {
            Object.assign(target, { [key]: source[key] });
        }
    }
}

module.exports = {
    mergeDeep
};