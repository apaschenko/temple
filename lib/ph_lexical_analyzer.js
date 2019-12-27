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
    STRING:   'string',
    ESC_HEAD: 'esc head',
    ESC_TAIL: 'esc tail'
};

const LEXEME_TYPE = {
    REGULAR: 'regular',
    STRING:  'string'
};

const ESCAPING = {
    '0': { value: '\0', tail: 0 },
    'n': { value: '\n', tail: 0 },
    'r': { value: '\r', tail: 0 },
    'v': { value: '\v', tail: 0 },
    't': { value: '\t', tail: 0 },
    'b': { value: '\b', tail: 0 },
    'f': { value: '\f', tail: 0 },
    'u': { value: '',   tail: 4 },
    'x': { value: '',   tail: 2 }
};


const eFormatter = function(layerName, fullEntry, symbol, position) {
    return `[layer: ${layerName}, placeholder: ${fullEntry}, symbol: ${symbol}, position: ${position}]`;
};

const phLexicalAnalyzer = function(placeholder, fullEntry, layerName, options, modules) {
    const { E: {Exceptions, Throw}, C: {OPERATORS, ESC_SYMBOL} } = modules;

    const
        BLANKS = ' \\f\\n\\r\\t\\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005' +
                 '\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000',
        QUOTES = '"\'`',
        OPEN_SQR_BRACKET = '[',
        CLOSE_SQR_BRACKET = ']',
        DOT = '.',
        COMMA = ',',
        DELIMITERS = DOT + COMMA,
        ESC = options.esc || ESC_SYMBOL;

    const phLength = placeholder.length;

    let result = [];
    let status = STATUS.BLANKS;
    let delimiter = undefined;
    let stringTerminator = undefined;
    let position = 0;
    let escId = '';
    let escTail = '';
    let escTailRemains = 0;
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
                    result.push({...lexeme});
                    lexeme.value = '';
                    status = STATUS.BLANKS;
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
                case STATUS.ESC_HEAD:
                    lexeme.value += symbol;
                    status = STATUS.STRING;
                    break;
                case STATUS.ESC_TAIL:
                    Throw(
                        Exceptions.UNTERMINATED_ESC_TAIL,
                        eFormatter(
                            layerName,
                            fullEntry,
                            `\\${escId}${escTail}`,
                            position - 2 - escTail.length
                        )
                    );
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
                        lexeme.delimiter = undefined;
                        stringTerminator = undefined;
                        status = STATUS.BLANKS;
                    } else {
                        lexeme.value += symbol;
                    }
                    break;
                case STATUS.ESC_HEAD:
                    lexeme.value += symbol;
                    status = STATUS.STRING;
                    break;
                case STATUS.ESC_TAIL:
                    Throw(
                        Exceptions.UNTERMINATED_ESC_TAIL,
                        eFormatter(
                            layerName,
                            fullEntry,
                            `\\${escId}${escTail}`,
                            position - 2 - escTail.length
                        )
                    );
                    break;
            }

        } else if (OPEN_SQR_BRACKET === symbol) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    if (lexeme.underBrackets) {
                        Throw(Exceptions.NESTED_OP_BRACKET, eFormatter(layerName, fullEntry, symbol, position));
                    } else if (delimiter) {
                        Throw(Exceptions.BRACKET_AFTER_DELIMITER, eFormatter(layerName, fullEntry, symbol, position));
                    } else {
                        if (lexeme.value.length > 0) {
                            result.push({...lexeme});
                        }
                        lexeme.value = '';
                        lexeme.underBrackets = true;
                        lexeme.delimiter = DOT;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
                case STATUS.ESC_HEAD:
                    lexeme.value += symbol;
                    status = STATUS.STRING;
                    break;
                case STATUS.ESC_TAIL:
                    Throw(
                        Exceptions.UNTERMINATED_ESC_TAIL,
                        eFormatter(
                            layerName,
                            fullEntry,
                            `\\${escId}${escTail}`,
                            position - 2 - escTail.length
                        )
                    );
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
                        delimiter = undefined;
                        status = STATUS.BLANKS;
                    }
                    break;
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
                case STATUS.ESC_HEAD:
                    lexeme.value += symbol;
                    status = STATUS.STRING;
                    break;
                case STATUS.ESC_TAIL:
                    Throw(
                        Exceptions.UNTERMINATED_ESC_TAIL,
                        eFormatter(
                            layerName,
                            fullEntry,
                            `\\${escId}${escTail}`,
                            position - 2 - escTail.length
                        )
                    );
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
                case STATUS.ESC_HEAD:
                    lexeme.value += symbol;
                    status = STATUS.STRING;
                    break;
                case STATUS.ESC_TAIL:
                    Throw(
                        Exceptions.UNTERMINATED_ESC_TAIL,
                        eFormatter(
                            layerName,
                            fullEntry,
                            `\\${escId}${escTail}`,
                            position - 2 - escTail.length
                        )
                    );
                    break;
            }

        } else if (ESC === symbol) {
            switch (status) {
                case STATUS.BLANKS:
                case STATUS.REGULAR:
                    Throw(Exceptions.UNEXPECTED_ESCAPING, eFormatter(layerName, fullEntry, symbol, position));
                    break;
                case STATUS.STRING:
                    status = STATUS.ESC_HEAD;
                    break;
                case STATUS.ESC_HEAD:
                    lexeme.value += symbol;
                    break;
                case STATUS.ESC_TAIL:
                    Throw(
                        Exceptions.UNTERMINATED_ESC_TAIL,
                        eFormatter(
                            layerName,
                            fullEntry,
                            `\\${escId}${escTail}`,
                            position - 2 - escTail.length
                        )
                    );
                    break;
            }

        } else {
            switch (status) {
                case STATUS.BLANKS:
                    lexeme.value += symbol;
                    status = STATUS.REGULAR;
                    break;
                case STATUS.REGULAR:
                case STATUS.STRING:
                    lexeme.value += symbol;
                    break;
                case STATUS.ESC_HEAD:
                    let escape = ESCAPING[symbol] || {value: symbol, tail: 0};
                    lexeme.value += escape.value;
                    escTailRemains = escape.tail;
                    escId = symbol;
                    status = (escTailRemains === 0) ? STATUS.STRING : STATUS.ESC_TAIL;
                    break;
                case STATUS.ESC_TAIL:
                    if (/[a-fA-F0-9]/.test(symbol)) {
                        escTail += symbol;
                        escTailRemains--;
                        if (escTailRemains === 0) {
                            lexeme.value = String.fromCharCode(parseInt(escTail, 16));
                            escTail = '';
                            status = STATUS.STRING;
                        }
                    } else {
                        Throw(
                            Exceptions.UNTERMINATED_ESC_TAIL,
                            eFormatter(
                                layerName,
                                fullEntry,
                                `\\${escId}${escTail}`,
                                position - 2 - escTail.length
                            )
                        );
                    }
                    break;
            }
        }
    }

    switch (status) {
        case STATUS.BLANKS:
            break;
        case STATUS.REGULAR:
            result.push({...lexeme});
            break;
        case STATUS.STRING:
        case STATUS.ESC_HEAD:
        case STATUS.ESC_TAIL:
            Throw(Exceptions.UNTERMINATED_STRING, eFormatter(layerName, fullEntry, '', position));
            break;
    }

    return result;
};

module.exports = phLexicalAnalyzer;
