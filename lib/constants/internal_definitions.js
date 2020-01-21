/**
 * Lib "all-templates"
 * Set of Constants
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const OPERATOR = {
    INSERT:  '=',
    IF    :  'if',
    UNLESS:  'unless',
    ELSE  :  'else',
    ELSIF :  'elsif',
    END   :  'end'
};

const LEXEME_TYPE = {
    REGULAR: 1,
    STRING : 2,
    TEXT   : 3,
    NUMBER : 4
};

const LEXEME_KIND = {
    REGULAR    : 1,
    EL_OF_ARRAY: 2,
    RELATIVE   : 3,
    FUNCTION   : 4,
    ARG_OF_FUNC: 5
};

const SYMBOL = {
    BLANKS           : ' \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005'
        + '\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000',
    QUOTES           : '\'"`',
    A_QUOTE          : '`',
    OPEN_SQR_BRACKET : '[',
    CLOSE_SQR_BRACKET: ']',
    OPEN_PARENTHESIS : '(',
    CLOSE_PARENTHESIS: ')',
    DOT              : '.',
    COMMA            : ',',
    CARET            : '^',
    DIGITS           : '0123456789',
    HASH             : '#'
};

const DELIMITER = {
    TEXT_STARTED     : 't',
    BLANK            : 'b',
    NONE             : 'n',
    OPEN_SQR_BRACKET : SYMBOL.OPEN_SQR_BRACKET,
    CLOSE_SQR_BRACKET: SYMBOL.CLOSE_SQR_BRACKET,
    OPEN_PARENTHESIS : SYMBOL.OPEN_PARENTHESIS,
    CLOSE_PARENTHESIS: SYMBOL.CLOSE_PARENTHESIS,
    DOT              : SYMBOL.DOT,
    COMMA            : SYMBOL.COMMA,
    HASH             : SYMBOL.HASH
};

const NODE_TYPE = {
    TEXT  : 't',
    INSERT: OPERATOR.INSERT,
    IF    : OPERATOR.IF
};


module.exports = {
    OPERATOR,
    LEXEME_TYPE,
    LEXEME_KIND,
    SYMBOL,
    DELIMITER,
    NODE_TYPE
};
