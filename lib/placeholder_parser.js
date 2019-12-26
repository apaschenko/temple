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
        ESC = options.esc || ESC_SYMBOL,
        RESTRICTED_AT_BEGIN = '\\.,]',
        ESC_AND_DELIMITERS = '.,[]' + ESC;

    const phLength = placeholder.length;

    let result = [];
    let status = STATUS.BLANKS;
    let underBracket = false;
    let position = 0;
    let lexeme = {
        value: '',
        type: undefined
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
        }
    }

};