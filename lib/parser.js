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
    PH_MAYBE_BLANK  : 'blank',
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
    REGULAR      : 'reg',
    EL_OF_ARRAY  : `arr's el`,
    FLOAT        : 'float',
    FUNCTION     : 'func',
    HAS_NO_PARENT: 'hnp'
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
    NUMBERS           = '1234567890';

const DELIMITER_TYPE = {
    BLANK: 'b',
    OPEN_SQR_BRACKET,
    CLOSE_SQR_BRACKET,
    OPEN_PARENTHESIS,
    CLOSE_PARENTHESIS,
    DOT,
    COMMA
};

const DELIMITERS = Object.values(DELIMITER_TYPE);

const INSERT_TYPE = {
    AS_CHILD: 'child',
    AS_ARG  : 'arg',
    AS_ROOT : 'root'
};

const OPERATORS = {
    INSERT:  '=',
    IF:      'if',
    UNLESS:  'unless',
    ELSE:    'else',
    END:     'end',
    COMMENT: '#'
};

const OPS_VALUES = Object.values(OPERATORS);

const ELEMENT_TYPE = {
    ...OPERATORS,
    TEXT   : '-text-',
    UNKNOWN: '-unknown-'
};

// representing a placeholder or a text chunk
class LayerElement {
    constructor(value, type = ELEMENT_TYPE.UNKNOWN) {
        this.value = value;
        this.type = type;
        return this;
    }

    addToArray(rootLexeme) {
        if (!Array.isArray(this.value)) {
           this.value = [];
        }
        this.value.push(rootLexeme);
        return this;
    }

    set(val) {
        this.value = val;
        return this;
    }


}

class LayerElementsList {
    constructor() {
        this.list = [];
        return this;
    }

    add(lexemeListOrString, isPlaceholder) {
        let element, elementType;
        if (isPlaceholder) {
            // TODO: analyze and convert element

            element = new LayerElement(lexemeListOrString, elementType);
            this.list.push(element);
        } else if (lexemeListOrString.length > 0) {
            element = new LayerElement(lexemeListOrString, ELEMENT_TYPE.TEXT);
            this.list.push(element);
        }

        return this;
    }
}

class LexemeList {
    constructor() {
        this.list = [];
    }

    add(lexeme, delimiterType) {
        let exception = false;
        let newLexeme;
        if (lexeme.getType() !== LEXEME_TYPE.UNKNOWN) {
            switch (delimiterType) {
                case DELIMITER_TYPE.BLANK:
                    if (lexeme.getParentKind() === LEXEME_KIND.HAS_NO_PARENT) {
                        newLexeme = new Lexeme();
                        this.list.push(lexeme);
                        lexeme = new Lexeme();
                    } else {
                        exception = 'PH_BLANK_IN_NESTED'
                    }
                    break;
            }
            this.list.push(lexeme);
            lexeme = new Lexeme();
        }
        return lexeme;
    }
}

class Lexeme {
    constructor(bracketStack) {
        this.bracketStack = bracketStack;
        this.value = '';
        this.type  = LEXEME_TYPE.UNKNOWN;
        this.kind  = LEXEME_KIND.REGULAR;
        this.firstArg  = false;;
        this.firstChild = false;
        this.parent = false;
        this.prev = false;
        this.next = false;
        this.firstSibling = false;

        return this;
    }

    addToValue(buffer) {
        this.value += buffer.toString;
        return this;
    }

    getType() {
        return this.type;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    getKind() {
        return this.kind;
    }

    setKind(kind) {
        this.kind = kind;
        return this;
    }

    getPrev() {
        return this.prev;
    }

    setPrev(lexeme) {
        this.prev = lexeme;
        return this;
    }

    getNext() {
        return this.next;
    }

    setNext(lexeme) {
       this.next = lexeme;
       return this;
    }

    getFirstArg() {
        return this.firstArg;
    }

    setFirstArg(lexeme) {
        this.firstArg = lexeme;
        return this;
    }

    getFirstChild() {
        return this.firstChild;
    };

    setFirstChild(lexeme) {
        this.firstChild = lexeme;
        return this;
    }

    getLength() {
        return this.value.length;
    }

    getParentKind() {
        return this.parent ? this.parent.getKind() : LEXEME_KIND.HAS_NO_PARENT;
    }

    getParent() {
        return this.parent;
    }

    setParent(lexeme) {
        this.parent = lexeme;
        return this;
    }

    terminate(delimiterType) {
        let exception = false;
        let newLexeme = this;
        let isLexemeMissing = this.type === LEXEME_TYPE.UNKNOWN;
        let lastBracket;

        switch (delimiterType) {
            case DELIMITER_TYPE.BLANK:
                if (isLexemeMissing) {
                    newLexeme = this;
                } else {
                    if (this.getParentKind() === LEXEME_KIND.HAS_NO_PARENT) {
                        newLexeme = new Lexeme();
                        this.next = newLexeme;
                        newLexeme.setPrev(this);
                        newLexeme.firstSibling = this.firstSibling || this;
                    } else {
                        exception = 'PH_BLANK_IN_NESTED'
                    }
                }
                break;

            case DELIMITER_TYPE.OPEN_SQR_BRACKET:
                if (isLexemeMissing) {
                    exception = 'PH_BRACKET_WITHOUT_LEXEME';
                } else {
                    newLexeme = new Lexeme().setKind(LEXEME_KIND.EL_OF_ARRAY).setParent(this);
                    this.firstChild = newLexeme;
                    this.bracketStack.push(DELIMITER_TYPE.OPEN_SQR_BRACKET);
                }
                break;

            case DELIMITER_TYPE.OPEN_PARENTHESIS:
                if (isLexemeMissing) {
                    exception = 'PH_PARENTHESIS_W_LEXEME'
                } else {
                    newLexeme = new Lexeme().setParent(this);
                    this.kind = LEXEME_KIND.FUNCTION;
                    this.firstArg = newLexeme;
                    this.bracketStack.push(DELIMITER_TYPE.OPEN_PARENTHESIS);
                }
                break;

            case DELIMITER_TYPE.CLOSE_SQR_BRACKET:
                lastBracket = this.bracketStack.pop();
                if (lastBracket !== DELIMITER_TYPE.OPEN_SQR_BRACKET) {
                    exception = 'PH_UNBALANCED_BRACKET';
                } else if (isLexemeMissing) {
                    exception = 'PH_MISSING_EL_OF_ARR';
                } else {
                    newLexeme = new Lexeme().setParent(this);
                    this.firstChild = newLexeme;
                }
                break;

            case DELIMITER_TYPE.CLOSE_PARENTHESIS:
                lastBracket = this.bracketStack.pop();
                if (lastBracket !== DELIMITER_TYPE.OPEN_PARENTHESIS) {
                    exception = 'PH_UNBALANCED_PAR';
                } else {
                    newLexeme = this.removeIfEmpty();
                }

            case DELIMITER_TYPE.COMMA:
                if (isLexemeMissing) {
                    exception = 'PH_COMMA_WITHOUT_LEXEME'
                } else {
                    if (this.getParentKind() === LEXEME_KIND.FUNCTION) {
                        newLexeme = new Lexeme();
                        this.next = newLexeme;
                        newLexeme.setPrev(this);
                    } else {
                        exception = 'PH_COMMA_NOT_IN_ARGS';
                    }
                }
                break;

            case DELIMITER_TYPE.DOT:
                if (isLexemeMissing) {
                    exception = 'PH_DOT_WITHOUT_LEXEME';
                } else {
                    newLexeme = new Lexeme();
                    newLexeme.setParent(this);
                    this.firstChild = newLexeme;
                }
                break;

        }

        return newLexeme;
    }

    getParentFunction() {
        let parentFunction = this;
        while (parentFunction.getKind() !== LEXEME_KIND.FUNCTION) {
            parentFunction = parentFunction.getParent();
            if (! parentFunction) {
                break;
            }
        }

        return parentFunction;
    }

    getLastArg() {
        let lastArg = this.firstArg;
        while (lastArg && lastArg.next) {
            lastArg = lastArg.next;
        }

        return lastArg;
    }

    removeIfEmpty() {
        let lexeme = this.getParentFunction();
        if (this.type === LEXEME_TYPE.UNKNOWN) {
            if (lexeme.getFirstArg() === this) {
                lexeme.setFirstArg(false);
            }
            if (this.parent.getFirstChild() === this) {
                this.parent.setFirstChild(false);
            }
            if (this.prev) {
                this.prev.setNext(false);
            }
        } else {
            lexeme = this;
        }

        return lexeme;
    }
}

const CLOSE_STATUS = {
    IN_PROGRESS: 'in pr',
    CLOSED     : 'closed',
    STILL_OPEN : 'open',
    GO_TO      : 'goto'
};

class Accumulator {
    constructor(openPh, closePh) {
        this.buffer = '';
        this.result = '';
        this.bracketStack = [];
        this.openPh = openPh;
        this.openPhMaxPosition = openPh.length - 1;
        this.closePh = closePh;
        this.closePhMaxPosition = closePh.length - 1;
        this.lastCheckedPos = -1;
        return this;
    }

    addToBracketStack(value) {
        this.bracketStack.push(value);
        return this;
    }

    removeFromBracketStack() {
        return (this.bracketStack.length > 0) ? this.bracketStack.pop() : false;
    }

    addValAndCheckOpenPh(symbol) {
        let isPhStarted = false;

        if (symbol === this.openPh[this.buffer.length]) {
            if (this.buffer.length === this.openPhMaxPosition) {
                isPhStarted = true;
                this.buffer = '';
            } else {
                this.buffer += symbol;
            }
        } else {
            this.result += (this.buffer + symbol);
            this.buffer = '';
        }

        return isPhStarted;
    }

    checkClosePh(symbol, posInLayer) {
        let bufferLength = this.buffer.length;
        let closeStatus;

        if ((this.lastCheckedPos < posInLayer) && (symbol === this.closePh[bufferLength])) {
            if (bufferLength === this.closePhMaxPosition) {
                this.buffer = '';
                closeStatus = CLOSE_STATUS.CLOSED;
            } else {
                this.buffer += symbol;
                closeStatus = CLOSE_STATUS.IN_PROGRESS;
            }
            if (0 === bufferLength) {
                this.lastCheckedPos = posInLayer;
            }
        } else {
            this.buffer = '';
            closeStatus = (bufferLength > 0) ? CLOSE_STATUS.GO_TO : CLOSE_STATUS.STILL_OPEN;
        }

        return closeStatus;
    }

    getNewPosition() {
        return this.lastCheckedPos - 1;
    }

    getResult() {
        return this.result;
    }

    clean() {
        this.result = this.buffer = '';
        return this;
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

const parser = function (renderData, modules) {
    const {openPh,  closePh, layer, layerName, escapeSymbol} = renderData;

    let posInLayer = 0;
    const  layerLength = layer.length;

    let status = STATUS.TEXT;

    let layerList = new LayerElementsList();
    let lexemeList, lexeme;
    let accumulator = new Accumulator(openPh, closePh);
    let blanked = false;

    let phStartedAt = -1;

    while (posInLayer < layerLength) {
        // abcd"[]{}efg {{if abc.`def`.^2.kl(dbe["as"].klm.`ufh`, "{{}}"}}

        const symbol = layer[posInLayer];

        switch (status) {
            case STATUS.TEXT:
                if (accumulator.addValAndCheckOpenPh(symbol)) { // if placeholder begun
                    layerList.add(accumulator.getResult(), false);
                    accumulator.clean();
                    lexemeList = new LexemeList();
                    lexeme = new Lexeme();
                    status = STATUS.PH_MAYBE_BLANK;
                    blanked = false;
                }
                break;

            case STATUS.PH_MAYBE_BLANK:
                let closingStatus = accumulator.checkClosePh(symbol, posInLayer);

                if (closingStatus === CLOSE_STATUS.CLOSED) {
                    lexemeList.add(lexeme);
                    layerList.add(lexemeList);
                    accumulator.clean();
                    status = STATUS.TEXT;
                    break;
                }
                if (closingStatus === CLOSE_STATUS.IN_PROGRESS) {
                    break;
                }
                if (closingStatus === CLOSE_STATUS.GO_TO) {
                    posInLayer = accumulator.getNewPosition();
                    break;
                }

                // closingStatus === CLOSE_STATUS.STILL_OPEN
                if (BLANKS.includes(symbol)) {

                } else {

                }
        }

        posInLayer += 1;
    }

    // add last text chunk
    layerList.add(accumulator.getResult(), false);

    // TODO: Check for the closing of last placeholder
};

const pars = function(renderData, modules) {
    const {openPh, openPhMaxPosition, closePh, closePhMaxPosition, layer, layerName, escapeSymbol} = renderData;

    let posInLayer = 0;
    const  layerLength = layer.length;

    let status = STATUS.TEXT;

    let phStartedAt;
    let maybePhCloseAt = -1;
    let maybePhClose = false;

    let accumulator = new Accumulator();
    let rootElement;
    let currentElement = rootElement = new Lexeme();
    let quote;
    let isEscape = false;

    while (posInLayer < layerLength) {
        const symbol = layer[posInLayer];

        switch (status) {
            case STATUS.TEXT:
                if (symbol === openPh[accumulator.getBufferPosition()]) {
                    if (accumulator.getBufferPosition() === openPhMaxPosition) {
                        accumulator.clean();
                        status = STATUS.PH_MAYBE_BLANK;
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

            case STATUS.PH_MAYBE_BLANK:
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
                                            currentElement = new Lexeme(INSERT_TYPE.AS_CHILD, currentElement)
                                                .setKind(LEXEME_KIND.EL_OF_ARRAY)
                                        } else { // symbol is parenthesis
                                            currentElement.setKind(LEXEME_KIND.FUNCTION);
                                            currentElement = new Lexeme(INSERT_TYPE.AS_ARG, currentElement);
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
                                        currentElement = new Lexeme(INSERT_TYPE.AS_CHILD, currentElement);
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
                                        currentElement = new Lexeme(INSERT_TYPE.AS_ARG, currentElement.parent);
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
                            status = STATUS.PH_MAYBE_BLANK;
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
                    status = STATUS.PH_MAYBE_BLANK;
                    posInLayer -= 1;
                }
                break;

            case STATUS.PH_LEXEME_BARE:
                if (NOT_IN_LEXEME.includes(symbol) || openPh.includes(symbol) || closePh.includes(symbol)) {
                    status = STATUS.PH_MAYBE_BLANK;
                    posInLayer -= 1;
                } else {
                    currentElement.addToValue(symbol);
                }
        }

        posInLayer += 1;
    }


};