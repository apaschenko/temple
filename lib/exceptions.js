/**
 * Lib "all-templates"
 * Exceptions
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

const prefix = '[all-template render]: ';

class Exception extends Error {
    constructor(exception, data) {
        super();
        this.message = `${exception.message} ${data}`;
        this.name = exception.name;
        this.code = exception.code;
    }
}

const Exceptions = {
    DATA_IS_EMPTY_MAP: {
        message: `Mandatory "data" parameter can't be an empty Map`,
        name:    'Data is an empty map',
        code:    1
    },

    DATA_IS_INVALID: {
        message: 'When "getters" are not defined or "template" defined, mandatory parameter "data" must be a simple' +
                 ` JS Object or Map only. It can't be empty and can't be any another type (like as Set, Array etc.)`,
        name:    'Invalid data',
        code:    2
    },

    DATA_IS_NOT_OBJECT: {
        message: `${prefix}When "getters" are not defined, "data" parameter of render function must be an Object only` +
                 ` (a non-empty "old-school" JS Object or a non-empty Map) but not any primitive JS type and can't be `+
                 `undefined`,
        name:    'Data is not an object',
        code:    3
    },

    GETTERS_IS_EMPTY_MAP: {
        message: `"getters" parameter can't be an empty Map`,
        name:    'Getters is an empty map',
        code:    4
    },

    GETTERS_IS_INVALID: {
        message: 'When "getters" are defined, this parameter must be a single Function, simple JS Object' +
                 ` or Map only. It can't be empty and can't be any another type (like as Set, Array etc.)`,
        name:    'Invalid getters',
        code:    5
    },

    GETTERS_IS_NOT_OBJECT: {
        message: `${prefix}When "getters" are defined, this parameter must be a Function or an Object only` +
                 ` (a non-empty "old-school" JS Object or a non-empty Map) but not any primitive JS type`,
        name:    'Getters is not an object',
        code:    6
    },

    GETTER_IS_NOT_FUNCTION: {
        message: `${prefix}Each value of "getters" Map or Object must be a Function only`,
        name:    'Getter is not a function',
        code:    7
    },

    INVALID_OPTIONS: {
        message: `${prefix}If "options" defined, then it must be a simple JS Object only but not primitive ` +
                 `(Number, String etc.) and can't be of Map, Set or similar types`,
        name:    'Invalid options',
        code:    8
    },

    UNKNOWN_KEY: {
        message: `${prefix}Unknown key: `,
        name:    'Unknown key',
        code:    9
    },

    INVALID_VALUE: {
        message: `${prefix}Invalid value of the key. It can be a non-empty string only: `,
        name:    'Invalid value',
        code:    10
    },

    INVALID_PH: {
        message: `${prefix}If "options.placeholder" defined, then it must be a simple JS Object only but not` +
                 ` primitive (Number, String etc.) and can't be of Map, Set or similar types`,
        name:    'Invalid placeholder',
        code:    11
    },

    INVALID_MODE: {
        message: `${prefix}If "options.mode" defined, then it must be a simple JS Object only but not` +
                 ` primitive (Number, String etc.) and can't be of Map, Set or similar types`,
        name:    'Invalid mode',
        code:    12
    },

    INVALID_KEY: {
        message: `${prefix}Each key must be a String, Symbol or Regexp only: `,
        name:    'Invalid key',
        code:    13
    },

    MISSING_ENTRY_POINT: {
        message: `${prefix}There is no entry point in the data, which is required to start parsing: `,
        name:    'Missing entry point',
        code:    14
    },

    CYCLIC_DEPENDENCE: {
        message: `${prefix}Cyclic dependence in the chain `,
        name:    'Cyclic dependence',
        code:    20
    },

    EMPTY_PLACEHOLDER: {
        message: `${prefix}Empty placeholders are not allowed: `,
        name:    'Empty placeholder',
        code:    21
    },

    TOO_MANY_PARTS: {
        message: `${prefix}Placeholder contains too many parts. Perhaps you are trying to define a source name with ` +
                 `blank symbols?`,
        name:    'Too many parts',
        code:    22
    },

    TOO_FEW_PARTS: {
        message: `${prefix}Placeholder contains an operator but don't contains a source name. `,
        name:    'Too few parts',
        code:    23
    },

    INVALID_CONTROL_FLOW: {
        message: `${prefix}The sequence of control operators is broken: `,
        name:    'Broken control sequence',
        code:    24
    }

};

const Throw = function(exception, data) {
    throw new Exception(exception, data || '');
};

module.exports = { Throw, Exceptions };