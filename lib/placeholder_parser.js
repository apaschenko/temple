/**
 * Lib "all-templates"
 * Placeholder parser
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
    BLANKS:               'blanks',
    REGULAR:              'regular',
    SINGLE_QUOTED_LITERAL: "'",
    DOUBLE_QUOTED_LITERAL: '"',
    ACUTE_QUOTED_LITERAL:  '`'
};


const eFormatter = function(layerName, fullEntry, symbol, position) {
    return `[layer: ${layerName}, placeholder: ${fullEntry}, symbol: ${symbol}, position: ${position}]`;
};

const phLexicalAnalyzer = function(placeholder, fullEntry, layerName, options, modules) {
    const { E: {Exceptions, Throw}, C: {OPERATORS, ESC_SYMBOL} } = modules;

    const
        BLANKS = ' \t',
        QUOTES = '"\'`',
        SINGLE_QUOTE = "'",
        DOUBLE_QUOTE = '"',
        ACUTE_QUOTE = '`',
        OPEN_SQR_BRACKET = '[',
        CLOSE_SQR_BRACKET = ']',
        DOT = '.',
        COMMA = ',',
        DELIMITERS = DOT + COMMA,
        ESC = options.esc || ESC_SYMBOL,
        RESTRICTED_AT_BEGIN = '\\.,]',
        ESC_AND_DELIMITERS = '.,[]' + ESC;

    const phLength = placeholder.length;

    let result = [];
    let status = STATUS.BLANKS;
    let escaping = false;
    let delimiter = undefined;
    let position = 0;
    let lexeme = {
        value: '',
        type: undefined,
        underBrackets: false,
        delimiter: undefined
    };

    while ((position++) < phLength) {
        let symbol = placeholder[position];

        if (BLANKS.includes(symbol)) {
            switch (status) {
                case STATUS.BLANKS:
                    break;
                case STATUS.REGULAR:
                    result.push(lexeme);
                    lexeme.value = '';
                    status = STATUS.BLANKS;
                    break;
                case STATUS.SINGLE_QUOTED_LITERAL:
                case STATUS.DOUBLE_QUOTED_LITERAL:
                case STATUS.ACUTE_QUOTED_LITERAL:
                    lexeme.value += symbol;
                    break;
            }

        } else if (QUOTES.includes(symbol)) {
            switch (status) {
                case STATUS.BLANKS:
                    lexeme.type = symbol;
                    lexeme.value = '';
                    lexeme.delimiter = delimiter;
                    delimiter = undefined;
                    status = symbol;
                    break;
                case STATUS.REGULAR:
                    Throw(Exceptions.ILLEGAL_QUOTE, eFormatter(layerName, fullEntry, symbol, position));
                    break; // for a testing purpose
                case STATUS.SINGLE_QUOTED_LITERAL:
                case STATUS.DOUBLE_QUOTED_LITERAL:
                case STATUS.ACUTE_QUOTED_LITERAL:
                    if (escaping || (status !== symbol)) {
                        lexeme.value += symbol;
                    } else {
                        result.push(lexeme);
                        lexeme.value = '';
                        lexeme.delimiter = undefined;
                        status = STATUS.BLANKS;
                    }
                    break;
            }

        } else if (OPEN_SQR_BRACKET === symbol) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    if (delimiter) {
                        Throw(Exceptions.BRACKET_AFTER_DELIMITER, eFormatter(layerName, fullEntry, symbol, position));
                    } else if (lexeme.underBrackets) {
                        Throw(Exceptions.NESTED_OP_BRACKET, eFormatter(layerName, fullEntry, symbol, position));
                    } else {
                        if (lexeme.value.length > 0) {
                            result.push(lexeme);
                        }
                        lexeme.value = '';
                        lexeme.underBrackets = true;
                        lexeme.delimiter = DOT;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.SINGLE_QUOTED_LITERAL:
                case STATUS.DOUBLE_QUOTED_LITERAL:
                case STATUS.ACUTE_QUOTED_LITERAL:
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
                            result.push(lexeme);
                        }
                        lexeme.value = '';
                        lexeme.underBrackets = false;
                        delimiter = undefined;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.SINGLE_QUOTED_LITERAL:
                case STATUS.DOUBLE_QUOTED_LITERAL:
                case STATUS.ACUTE_QUOTED_LITERAL:
                    lexeme.value += symbol;
                    break;
            }

        } else if (DELIMITERS.includes(symbol)) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    if (delimiter) {
                        Throw(Exceptions.DOUBLE_DELIMITER, eFormatter(layerName, fullEntry, symbol, position));
                    } else {
                        if (lexeme.value.length > 0) {
                            result.push(lexeme);
                        }
                        lexeme.value = '';
                        lexeme.delimiter = delimiter = symbol;
                        delimiter = undefined;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.SINGLE_QUOTED_LITERAL:
                case STATUS.DOUBLE_QUOTED_LITERAL:
                case STATUS.ACUTE_QUOTED_LITERAL:
                    lexeme.value += symbol;
                    break;
            }

        }

        escaping = (ESC === symbol) && !escaping;
    }

};