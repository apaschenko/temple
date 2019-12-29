/**
 * Lib "all-templates"
 * Placeholder parser
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
    BLANKS:   'blanks',
    REGULAR:  'regular',
    STRING:   'string'
};

const LEXEME_TYPE = {
    REGULAR: 'regular',
    STRING:  'string'
};

const eFormatter = function(layerName, fullEntry, symbol, position) {
    return `[layer: ${layerName}, placeholder: ${fullEntry}, symbol: ${symbol}, position: ${position}]`;
};

const phLexicalAnalyzer = function(analyzerInput, options, modules) {
    const {placeholder, fullEntry, layerName} = analyzerInput;
    const { E: {Exceptions, Throw} } = modules;

    const
        BLANKS = ' \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005' +
                 '\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000',
        QUOTES = '"\'`',
        OPEN_SQR_BRACKET = '[',
        CLOSE_SQR_BRACKET = ']',
        DOT = '.',
        COMMA = ',',
        DELIMITERS = DOT + COMMA;

    const phLength = placeholder.length;

    let result = [];
    let status = STATUS.BLANKS;
    let delimiter = undefined;
    let stringTerminator = undefined;
    let position = 0;
    let lexeme = {
        value: '',
        type: undefined,
        underBrackets: false,
        delimiter: undefined
    };

    while (position < phLength) {
        let symbol = placeholder[position];

        if (BLANKS.includes(symbol)) {
            switch (status) {
                case STATUS.BLANKS:
                    break;
                case STATUS.REGULAR:
                    result.push({...lexeme});
                    lexeme.value = '';
                    status = STATUS.BLANKS;
                    delimiter = undefined;
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
             }

        } else if (QUOTES.includes(symbol)) {
            switch (status) {
                case STATUS.BLANKS:
                    stringTerminator = symbol;
                    lexeme.type = LEXEME_TYPE.STRING;
                    lexeme.value = '';
                    lexeme.delimiter = delimiter;
                    delimiter = undefined;
                    status = STATUS.STRING;
                    break;
                case STATUS.REGULAR:
                    Throw(Exceptions.ILLEGAL_QUOTE, eFormatter(layerName, fullEntry, symbol, position));
                    break; // for a testing purpose
                case STATUS.STRING:
                    if (stringTerminator === symbol) {
                        result.push({...lexeme});
                        lexeme.value = '';
                        lexeme.delimiter = delimiter = undefined;
                        stringTerminator = undefined;
                        status = STATUS.BLANKS;
                    } else {
                        lexeme.value += symbol;
                    }
                    break;
            }

        } else if (OPEN_SQR_BRACKET === symbol) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    if (lexeme.underBrackets) {
                        Throw(Exceptions.NESTED_OP_BRACKET, eFormatter(layerName, fullEntry, symbol, position));
                        return; // for the testing purpose
                    } else if (delimiter) {
                        Throw(Exceptions.BRACKET_AFTER_DELIMITER, eFormatter(layerName, fullEntry, symbol, position));
                        return; // for the testing purpose
                    } else {
                        if (lexeme.value.length > 0) {
                            result.push({...lexeme});
                        }
                        lexeme.value = '';
                        lexeme.underBrackets = true;
                        lexeme.delimiter = undefined;
                        delimiter = undefined;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
            }

        } else if (CLOSE_SQR_BRACKET === symbol) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    if (!lexeme.underBrackets) {
                        Throw(Exceptions.ILLEGAL_CL_BRACKET, eFormatter(layerName, fullEntry, symbol, position));
                    } else {
                        if (lexeme.value.length > 0) {
                            result.push({...lexeme});
                        }
                        lexeme.value = '';
                        lexeme.underBrackets = false;
                        lexeme.delimiter = delimiter = undefined;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
            }

        } else if (DELIMITERS.includes(symbol)) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    if (delimiter) {
                        Throw(Exceptions.DOUBLE_DELIMITER, eFormatter(layerName, fullEntry, symbol, position));
                        return; // for the testing purpose
                    } else {
                        if (lexeme.value.length > 0) {
                            result.push({...lexeme});
                        }
                        lexeme.value = '';
                        lexeme.delimiter = delimiter = symbol;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
             }

        } else {
            switch (status) {
                case STATUS.BLANKS:
                    lexeme.value += symbol;
                    lexeme.type = LEXEME_TYPE.REGULAR;
                    status = STATUS.REGULAR;
                    delimiter = undefined;
                    break;
                case STATUS.REGULAR:
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
            }
        }

        position += 1;
    }

    switch (status) {
        case STATUS.BLANKS:
            break;
        case STATUS.REGULAR:
            result.push({...lexeme});
            break;
        case STATUS.STRING:
            Throw(Exceptions.UNTERMINATED_STRING, eFormatter(layerName, fullEntry, '', position));
            break;
    }

    return result;
};

module.exports = phLexicalAnalyzer;
