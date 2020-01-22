/**
 * Lib "all-templates"
 * Exceptions
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

const prefix = '[all-template render]: ';

class Exception extends Error {
    constructor(exception, description) {
        super();
        this.message = exception.message + description;
    }
}

const Exceptions = {
    PARSING_ERRORS: {
        message: '--- Parsing Errors ---'
    },

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
    },

    ILLEGAL_QUOTE: {
        message: `Forbidden syntax construct: The string literal begins immediately after the identifier. ` +
                 `Did you miss the delimiter (".", "," or "[")? `,
        name:    'Illegal quote',
        code:    31
    },

    BRACKET_AFTER_DELIMITER: {
        message: `Forbidden syntax construct: An opening square bracket was found after the delimiter ("." or ","). `,
        name:    'Square bracket after delimiter',
        code:    32
    },

    NESTED_OP_BRACKET: {
        message: `Forbidden syntax construct: The nested square brackets. `,
        name:    'Nested square brackets',
        code:    33
    },

    ILLEGAL_CL_BRACKET: {
        message: `Forbidden syntax construct: The closing square bracket is not preceded by an opening bracket. `,
        name:    'Unexpected close square bracket',
        code:    34
    },

    DOUBLE_DELIMITER: {
        message: `Forbidden syntax construct: Two delimiters ("." or ",") found in a row. `,
        name:    'Double delimiters',
        code:    35
    },

    UNTERMINATED_STRING: {
        message: `Forbidden syntax construct: An unterminated string literal. `,
        name:    'Unterminated literal',
        code:    37
    }

};


const ErrorName = {
    HEADER: 'The parser detected the following error(s) in the placeholders (parsing was interrupted due to these '
        +' errors, so the placeholders may contain other errors too):',

    UNTERMINATED_OPERATORS: 'Unclosed IF/UNLESS operators were detected. Each IF/UNLESS operator must be closed '
        +'using the "END" placeholder.',

    PH_BLANK_BETWEEN_NESTED_LEXEMES: 'There is no delimiter (dot, comma, square bracket, etc.) between two nested '
        + 'identifiers. Only spaces without any another delimiter can only be used to separate operator parts. '
        + 'Please see the manual.'
};


const Throw = function(exception, description) {
    throw new Exception(exception, description || '');
};

module.exports = { Throw, Exceptions, ErrorName };