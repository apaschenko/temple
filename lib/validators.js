/**
 * Lib "all-templates"
 * Parameters validations
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const checkKeys = function(object, allowedKeys, prefix, E) {
    let objKeys = Object.keys(object);

    for (let objKey of objKeys) {
        if (! allowedKeys.includes(objKey)) {
            E.Throw(E.Exceptions.UNKNOWN_KEY, `"${prefix}.${objKey}"`);
        }
    }
};

const checkString = function(inputString, keyName, E) {
    if ((inputString !== null)
        && (inputString !== undefined)
        && !(('string' === typeof inputString) && inputString.length > 0)) {
        E.Throw(E.Exceptions.INVALID_VALUE, `"${keyName}"`);
    }
};

const InputValidator = function(modules, input) {
    const { E, C } = modules;
    const {getters, data, options} = input;

    /* keys format */
    if (getters) {
        if (input.isGettersMap) {
            getters.forEach((v, k) => {
                if (('string' !== typeof k) && ('symbol' !== typeof k) && !(k instanceof RegExp)) {
                    E.Throw(E.Exceptions.INVALID_KEY, '"getters" parameter');
                }
            })
        }
    } else {
        if (input.isDataMap) {
            data.forEach((v, k) => {
                if (('string' !== typeof k) && ('symbol' !== typeof k) && !(k instanceof RegExp)) {
                    E.Throw(E.Exceptions.INVALID_KEY, '"data" parameter');
                }
            })
        }
    }

    /* data */
    let startName = ('object' === typeof options) && options['start_name'] || C.ENTRY_POINT_NAME;

    if ('object' === typeof data) {
        if (input.isDataMap) {
            if (data.keys().next().done) {
                E.Throw(E.Exceptions.DATA_IS_EMPTY_MAP);
            } else if (! data.has(startName)) {
                E.Throw(E.Exceptions.MISSING_ENTRY_POINT, `data.${startName}`);
            }
        } else {
            if (Array.isArray(data) || (Object.keys(data).length === 0)) {
                E.Throw(E.Exceptions.DATA_IS_INVALID);
            } else if (! data.hasOwnProperty(startName)) {
                E.Throw(E.Exceptions.MISSING_ENTRY_POINT, `data.${startName}`);
            }
        }
    } else {
        E.Throw(E.Exceptions.DATA_IS_NOT_OBJECT);
    }


    /* getters */
    if (getters && ('function' !== typeof getters)) {
        if ('object' === typeof getters) {
            if (input.isGettersMap) {
                if (getters.keys().next().done) {
                    E.Throw(E.Exceptions.GETTERS_IS_EMPTY_MAP);
                } else {
                    for (let fName of getters.keys()) {
                        if ('function' !== typeof getters.get(fName) ) {
                            E.Throw(E.Exceptions.GETTER_IS_NOT_FUNCTION);
                        }
                    }
                }
            } else {
                if ((Object.keys(getters).length === 0) || Array.isArray(getters)) {
                    E.Throw(E.Exceptions.GETTERS_IS_INVALID);
                } else {
                    for (let fName of Object.keys(getters)) {
                        if ('function' !== typeof getters[fName]) {
                            E.Throw(E.Exceptions.GETTER_IS_NOT_FUNCTION);
                        }
                    }
                }
             }
        } else {
            E.Throw(E.Exceptions.GETTERS_IS_NOT_OBJECT);
        }
    }


    /* options */
    if (
        ('object' != typeof options) ||
        Array.isArray(options) ||
        (options instanceof Map) ||
        (options instanceof Set)
    ) {
        E.Throw(E.Exceptions.INVALID_OPTIONS);
        return; // for the testing purpose only
    }

    const optsAllowedKeys = ['start_name', 'placeholder', 'mode'];
    checkKeys(options, optsAllowedKeys, 'options', E);

    checkString(options['start_name'], `options['start_name']`, E);
    let ph = options.placeholder;
    if (ph) {
        if (('object' != typeof ph) || Array.isArray(ph) || (ph instanceof Map) || (ph instanceof Set)) {
            E.Throw(E.Exceptions.INVALID_PH);
        } else {
            const phAllowedKeys = ['open', 'close'];
            checkKeys(ph, phAllowedKeys, 'options.placeholder', E);

            phAllowedKeys.forEach(key => {
                if (ph.hasOwnProperty(key)) {
                    checkString(ph[key], `options.placeholder.${key}`, E);
                }
            });
        }
    }

    let mode = options.mode;
    if (mode) {
        if (('object' != typeof mode) || Array.isArray(mode) || (mode instanceof Map) || (mode instanceof Set)) {
            E.Throw(E.Exceptions.INVALID_MODE);
        } else {
            const phAllowedKeys = ['fast'];
            checkKeys(mode, phAllowedKeys, 'options.mode', E);
        }
    }
};


module.exports = {
    InputValidator
};