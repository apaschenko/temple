/**
 * Lib "all-templates"
 * Placeholder parser.js
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
    TEXT            : 'text',
    PH_BLANK        : 'blank',
    PH_LEXEME_QUOTED: 'lex qtd',
    PH_LEXEME_NUMBER: 'lex num',
    PH_LEXEME_BARE  : 'lex bare'
};

const LEXEME_TYPE = {
    REGULAR: 'regular',
    STRING : 'string',
    UNKNOWN: 'unknown'
};

const LEXEME_KIND = {
    REGULAR    : 'regular',
    EL_OF_ARRAY: `array's element`,
    PARENT     : 'parent',
    FUNCTION   : 'function'
};

const
    BLANKS            = ' \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005' +
                        '\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000',
    QUOTES            = '\'"`',
    A_QUOTE           = '`',
    CARET             = '^',
    OPEN_SQR_BRACKET  = '[',
    CLOSE_SQR_BRACKET = ']',
    OPEN_PARENTHESIS  = '(',
    CLOSE_PARENTHESIS = ')',
    DOT               = '.',
    COMMA             = ',',
    NUMBERS           = '1234567890',
    NOT_IN_LEXEME     = `${BLANKS}${QUOTES}${OPEN_SQR_BRACKET}${CLOSE_SQR_BRACKET}${OPEN_PARENTHESIS}` +
                        `${CLOSE_PARENTHESIS}${DOT}${COMMA}`;

const INSERT_TYPE = {
    AS_CHILD: 'child',
    AS_ARG  : 'arg',
    AS_ROOT : 'root'
};

class Element {
    constructor(insertType = INSERT_TYPE.AS_ROOT, parent) {
        this.value = '';
        this.type  = LEXEME_TYPE.UNKNOWN;
        this.kind  = LEXEME_KIND.REGULAR;
        this.args  = [];
        this.child = false;
        if (parent) {
            this.parent = parent;
            switch (insertType) {
                case INSERT_TYPE.AS_CHILD:
                    parent.child = this;
                    break;
                case INSERT_TYPE.AS_ARG:
                    parent.args.push(this);
                    break;
            }
        } else {
            this.parent = false;
        }
        return this;
    }

    addToValue(buffer) {
        this.value += buffer.toString;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setKind(kind) {
        this.kind = kind;
    }

    getLength() {
        return this.value.length;
    }
}

class Accumulator {
    constructor() {
        this.buffer = '';
        this.result = '';
        this.visibilityStack = [];
        this.bracketStack = [];
        return this;
    }

    isVisible() {
        let visible = true;
        for (let item of this.visibilityStack) {
            if (! item) {
                visible = false;
                break;
            }
        }
        return visible;
    }

    addToVisStack(value) {
        this.visibilityStack.push(value);
        return this;
    }

    removeFromVisStack() {
        this.visibilityStack.pop();
        return this;
    }

    addToBracketStack(value) {
        this.bracketStack.push(value);
        return this;
    }

    removeFromBracketStack() {
        return (this.bracketStack.length > 0) ? this.bracketStack.pop() : false;
    }

    addToValue(buffer) {
        this.buffer += buffer;
        return this;
    }

    moveValToResIfVisible(buffer) {
        if (this.isVisible()) {
            this.result += (this.buffer + buffer);
        }
        this.buffer = '';
        return this;
    }

    clean() {
        this.buffer = '';
        return this;
    }

    getBufferPosition() {
        return this.buffer.length;
    }
}

const emitThrow = function(excName, layerName, fullEntry, symbol, position, modules) {
    const { E: {Exceptions, Throw} } = modules;
    Throw(
        Exceptions[excName],
        `[layer: ${layerName}, placeholder: ${fullEntry}, symbol: ${symbol}, position: ${position}]`
    );
};

const printPlaceholder = function (layer, startedPosition, closePh, modules) {
    let sub = layer.substring(startedPosition);
    let last = sub.indexOf(closePh);
    if (last === -1) {
        last = modules.C.DEF_PRINT_LENGTH;
    } else {
        last += closePh.length + 1;
    }
    return sub.substring(0, last);
};

const parser = function(renderData, modules) {
    const {openPh, openPhMaxPosition, closePh, closePhMaxPosition, layer, layerName, escapeSymbol} = renderData;

    let posInLayer = 0;
    const  layerLength = layer.length;

    let status = STATUS.TEXT;

    let phStartedAt;
    let maybePhCloseAt = -1;
    let maybePhClose = false;

    let accumulator = new Accumulator();
    let rootElement;
    let currentElement = rootElement = new Element();
    let quote;
    let isEscape = false;

    while (posInLayer < layerLength) {
        const symbol = layer[posInLayer];

        switch (status) {
            case STATUS.TEXT:
                if (symbol === openPh[accumulator.getBufferPosition()]) {
                    if (accumulator.getBufferPosition() === openPhMaxPosition) {
                        accumulator.clean();
                        status = STATUS.PH_BLANK;
                    } else {
                        accumulator.addToValue(symbol);
                    }
                    if (0 === accumulator.getBufferPosition()) {
                        phStartedAt = posInLayer;
                    }
                } else {
                    accumulator.moveValToResIfVisible(symbol);
                }
                break;

            case STATUS.PH_BLANK:
                if (! BLANKS.includes(symbol)) {
                    if ((maybePhCloseAt < posInLayer) && (symbol === closePh[accumulator.getBufferPosition()])) {
                        if (accumulator.getBufferPosition() === closePhMaxPosition) {
                            accumulator.clean();
                            status = STATUS.TEXT;
                        } else {
                            accumulator.addToValue(symbol);
                        }
                        if (0 === accumulator.getBufferPosition()) {
                            maybePhCloseAt = posInLayer;
                            maybePhClose = true;
                        }
                    } else {
                        accumulator.clean();
                        if (maybePhClose) {
                            posInLayer = maybePhCloseAt;
                            maybePhClose = false;
                        }

                        if (QUOTES.includes(symbol)) {
                            if (currentElement.getLength() > 0) {
                                emitThrow(
                                    'QUOTE_WITHOUT_DELIMITER',
                                    layerName,
                                    printPlaceholder(layer, phStartedAt, closePh, modules),
                                    symbol,
                                    posInLayer - phStartedAt,
                                    modules
                                )
                            } else {
                                quote = symbol;
                                accumulator.clean();
                                currentElement.setType((symbol === A_QUOTE)
                                    ? LEXEME_TYPE.REGULAR
                                    : LEXEME_TYPE.STRING);
                                status = STATUS.PH_LEXEME_QUOTED;
                            }
                        } else {
                            switch (symbol) {
                                case OPEN_SQR_BRACKET:
                                case OPEN_PARENTHESIS:
                                    if (currentElement.getLength() === 0) {
                                        emitThrow(
                                            'UNEXPECTED_BRACKET',
                                            layerName,
                                            printPlaceholder(layer, phStartedAt, closePh, modules),
                                            symbol,
                                            posInLayer - phStartedAt,
                                            modules
                                        )
                                    } else {
                                        accumulator.addToBracketStack(symbol);
                                        if (symbol === OPEN_SQR_BRACKET) {
                                            currentElement = new Element(INSERT_TYPE.AS_CHILD, currentElement)
                                                .setKind(LEXEME_KIND.EL_OF_ARRAY)
                                        } else { // symbol is parenthesis
                                            currentElement.setKind(LEXEME_KIND.FUNCTION);
                                            currentElement = new Element(INSERT_TYPE.AS_ARG, currentElement);
                                        }
                                    }
                                    break;

                                case CLOSE_SQR_BRACKET:
                                    if (accumulator.removeFromBracketStack() !== OPEN_SQR_BRACKET) {
                                        emitThrow(
                                            'UNBALANCED_SQR_BRACKET',
                                            layerName,
                                            printPlaceholder(layer, phStartedAt, closePh, modules),
                                            symbol,
                                            posInLayer - phStartedAt,
                                            modules
                                        );
                                    } else {

                                    }
                                    break;

                                case CLOSE_PARENTHESIS:
                                    if (accumulator.removeFromBracketStack() !== OPEN_PARENTHESIS) {
                                        emitThrow(
                                            'UNBALANCED_PARENTHESIS',
                                            layerName,
                                            printPlaceholder(layer, phStartedAt, closePh, modules),
                                            symbol,
                                            posInLayer - phStartedAt,
                                            modules
                                        );
                                    } else {
                                        currentElement = currentElement.parent;
                                    }
                                    break;

                                case CARET:
                                    currentElement.setKind(LEXEME_KIND.PARENT);
                                    status = STATUS.PH_LEXEME_NUMBER;
                                    break;

                                case DOT:
                                    if (currentElement.type === LEXEME_TYPE.UNKNOWN) {
                                        emitThrow(
                                            'UNEXPECTED_DOT',
                                            layerName,
                                            printPlaceholder(layer, phStartedAt, closePh, modules),
                                            symbol,
                                            posInLayer - phStartedAt,
                                            modules
                                        )
                                    } else {
                                        currentElement = new Element(INSERT_TYPE.AS_CHILD, currentElement);
                                    }
                                    break;

                                case COMMA:
                                    if ((currentElement.type === LEXEME_TYPE.UNKNOWN)) {
                                        emitThrow(
                                            'UNEXPECTED_COMMA',
                                            layerName,
                                            printPlaceholder(layer, phStartedAt, closePh, modules),
                                            symbol,
                                            posInLayer - phStartedAt,
                                            modules
                                        )
                                    } else if (
                                        !currentElement.parent || currentElement.parent.kind !== LEXEME_KIND.FUNCTION
                                    ) {
                                        emitThrow(
                                            'COMMA_NOT_IN_ARGS',
                                            layerName,
                                            printPlaceholder(layer, phStartedAt, closePh, modules),
                                            symbol,
                                            posInLayer - phStartedAt,
                                            modules
                                        )
                                    } else {
                                        currentElement = new Element(INSERT_TYPE.AS_ARG, currentElement.parent);
                                    }
                                    break;

                                default:
                                    status = STATUS.PH_LEXEME_BARE;
                                    posInLayer -= 1;
                            }
                        }

                    }

                }
                break;

            case STATUS.PH_LEXEME_QUOTED:
                if (isEscape) {
                    currentElement.addToValue(symbol);
                    isEscape = false;
                } else {
                    switch (symbol) {
                        case escapeSymbol:
                            isEscape = true;
                            break;

                        case quote:
                            status = STATUS.PH_BLANK;
                            break;

                        default:
                            currentElement.addToValue(symbol);
                            break;
                    }
                }
                break;

            case STATUS.PH_LEXEME_NUMBER:
                if (NUMBERS.includes(symbol)) {
                    currentElement.addToValue(symbol);
                } else {
                    status = STATUS.PH_BLANK;
                    posInLayer -= 1;
                }
                break;

            case STATUS.PH_LEXEME_BARE:
                if (NOT_IN_LEXEME.includes(symbol) || openPh.includes(symbol) || closePh.includes(symbol)) {
                    status = STATUS.PH_BLANK;
                    posInLayer -= 1;
                } else {
                    currentElement.addToValue(symbol);
                }
        }

        posInLayer += 1;
    }

    
};