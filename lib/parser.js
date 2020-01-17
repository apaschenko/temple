/**
 * Lib "all-templates"
 * Placeholder parser.js
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
    TEXT      : 0,
    PH_REGULAR: 1,
    PH_STRING : 2
};

const LEXEME_TYPE = {
    REGULAR: 0,
    STRING : 1,
    TEXT   : 3
};

const LEXEME_KIND = {
    UNKNOWN    : 0,
    REGULAR    : 1,
    EL_OF_ARRAY: 2,
    RELATIVE   : 3,
    FUNCTION   : 4,
    ARG_OF_FUNC: 5
};

const
    BLANKS            = ' \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005' +
                        '\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000',
    QUOTES            = '\'"`',
    A_QUOTE           = '`',
    OPEN_SQR_BRACKET  = '[',
    CLOSE_SQR_BRACKET = ']',
    OPEN_PARENTHESIS  = '(',
    CLOSE_PARENTHESIS = ')',
    DOT               = '.',
    COMMA             = ',',
    CARET             = '^';

const DELIMITER_TYPE = {
    PH_STARTED  : 'p',
    TEXT_STARTED: 't',
    BLANK       : 'b',
    NONE        : 'n',
    OPEN_SQR_BRACKET,
    OPEN_PARENTHESIS,
    DOT,
    COMMA
};

const DELIMITERS = Object.values(DELIMITER_TYPE);

const OPERATORS = {
    INSERT:  '=',
    IF:      'if',
    UNLESS:  'unless',
    ELSE:    'else',
    END:     'end',
    COMMENT: '#'
};

const OPS_VALUES = Object.values(OPERATORS);

const INSERT_TYPE = {
    ROOT     : 0,
    SIBLING  : 1,
    FIRST_ARG: 2,
    CHILD    : 3
};


class Lexeme {
    constructor() {
        this.value            = '';
        this.firstArg         = null;
        this.child            = null;
        this.parent           = null;
        this.prev             = null;
        this.next             = null;
        this.terminator       = null;
        this.terminated       = null;
        this.willBeInsertedAs = null;
        this.type             = null;
        this.kind             = null;

        return this;
    }

    addToValue(buffer) {
        this.value += buffer.toString;
        return this;
    }

    setValue(value) {
        this.value = value;
        return this;
    }

    isTerminated() {
        return this.terminated;
    }

    marksTerminated() {
        this.terminated = true;
    }

    isEmpty() {
       return this.value.length === 0;
    }

    isNotEmpty() {
        return this.value.length > 0;
    }

    getTerminator() {
        return this.terminator;
    }

    setTerminator(terminator) {
        this.terminator = terminator;
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

    getChild() {
        return this.child;
    };

    setChild(lexeme) {
        this.child = lexeme;
        return this;
    }

    getLength() {
        return this.value.length;
    }

    getParent() {
        return this.parent;
    }

    setParent(lexeme) {
        this.parent = lexeme;
        return this;
    }

    getInsertType() {
        return this.willBeInsertedAs;
    }

    setInsertType(insertType) {
        this.willBeInsertedAs = insertType;
        return this;
    }
}

class Accumulator {
    constructor(renderData, layerName, layer) {
        this.renderData = renderData;
        this.layerName = layerName;
        this.layer = layer;
        this.buffer = '';
        this.result = '';
        this.errors = [];
        this.phStartedAt = -1;
        this.bracketStack = [];
        this.openPh = renderData.openPh;
        this.openPhMaxPosition = renderData.openPh.length - 1;
        this.closePh = renderData.closePh;
        this.closePhMaxPosition = renderData.closePh.length - 1;
        this.lastCheckedPos = -1;
        this.layerList = [];
        this.status = STATUS.TEXT;
        this.currentLexeme = false;

        return this;
    }

    eFormatter(eName, fullEntry, symbol, position) {
        this.errors.push({
            eName,
            data: `[layer: ${this.layerName}, placeholder: ${fullEntry}, symbol: ${symbol}, position: ${position}]`
        });
    };

    parse() {
        const {openPh,  closePh, escapeSymbol} = this.renderData;
        let posInLayer = 0;
        this.status = STATUS.TEXT;
        this.currentLexeme = null;
        this.rootLexeme = null;

        const layerLength = this.layer.length;
        let delimiterType = DELIMITER_TYPE.BLANK;
        let insertType;

        let phStartedAt = -1;
        let escaping = false;
        let isString = false;

        while (posInLayer < layerLength) {
            // abcd"[]{}efg {{if abc.`def`.^2.kl(dbe["as"].klm.`ufh`, "{{}}"}}

            const symbol = this.layer[posInLayer];

            switch (status) {
                case STATUS.TEXT:
                    if (symbol === this.openPh[this.buffer.length]) {
                        if (this.buffer.length === this.openPhMaxPosition) {
                            this.addLexemeAndCreateNew(INSERT_TYPE.TEXT);
                            this.currentLexeme.setValue(this.result)
                                .setType(LEXEME_TYPE.TEXT);

                            this.buffer = this.result = '';
                            this.phStartedAt = posInLayer - (this.openPhMaxPosition + 1);

                            // switch to "regular" status
                            this.rootLexeme = null;
                            delimiterType = DELIMITER_TYPE.PH_STARTED;
                            this.status = STATUS.PH_REGULAR;

                        } else {
                            this.buffer += symbol;
                        }
                    } else {
                        this.result += (this.buffer + symbol);
                        this.buffer = '';
                    }
                    break;

                case STATUS.PH_REGULAR:
                    let bufferLength = this.buffer.length;

                    // First: the checking of placeholder closing
                    if ((this.lastCheckedPos < posInLayer) && (symbol === this.closePh[bufferLength])) {
                        if (0 === bufferLength) {
                            this.lastCheckedPos = posInLayer;
                        }

                        if (bufferLength === this.closePhMaxPosition) {
                            if (rootLexeme.isEmpty()) {
                                this.eFormatter(
                                    'PH_IS_EMPTY',
                                    this.layer.substring(this.phStartedAt, posInLayer),
                                    symbol,
                                    0
                                );
                            }

                            rootLexeme = false;
                            this.buffer = this.result = '';
                            status = STATUS.TEXT;
                            break;
                        } else {
                            this.buffer += symbol;
                            break;
                        }
                    } else {
                        this.buffer = '';
                        if (bufferLength > 0) {
                            posInLayer = this.lastCheckedPos - 1;
                            break;
                        }
                    }

                    // Second: Processing symbol in the regular mode
                    if (BLANKS.includes(symbol)) {
                        if (delimiterType === DELIMITER_TYPE.NONE) {
                            delimiterType = DELIMITER_TYPE.BLANK;
                        }

                    } else if (QUOTES.includes(symbol)) { // quoted lexeme is started
                        this.calculateInsertData(delimiterType, this.currentLexeme) {}
                        status = STATUS.PH_STRING;





                        switch (this.currentLexeme.getType()) {
                            case LEXEME_TYPE.UNKNOWN:
                                switch (delimiterType) {
                                    case DELIMITER_TYPE.NONE:
                                        if (rootLexeme === this.currentLexeme) {
                                            this.currentLexeme.setType(LEXEME_TYPE.STRING).setTerminator(symbol);
                                        } else {
                                            this.eFormatter(
                                                'PH_UNEXPECTED_QUOTE',
                                                this.layer.substring(this.phStartedAt, posInLayer),
                                                symbol,
                                                posInLayer
                                            );
                                        }
                                        break;

                                    case DELIMITER_TYPE.BLANK:
                                        if (this.bracketStack.length === 0) {
                                            this.addLexemeAndCreateNew(INSERT_TYPE.SIBLING);
                                            this.currentLexeme.setType(LEXEME_TYPE.STRING)
                                                .setTerminator(symbol)
                                                .setPrev(this.getLastTopLevelLexeme(rootLexeme));
                                        } else {
                                            this.eFormatter(
                                                'PH_BLANKS_BETWEEN_NESTED_LEXEMES',
                                                this.layer.substring(this.phStartedAt, posInLayer),
                                                symbol,
                                                posInLayer
                                            );
                                        }
                                        break;

                                    case DELIMITER_TYPE.OPEN_PARENTHESIS



                                }
                                this.currentLexeme.setType(LEXEME_TYPE.STRING);
                                this.currentLexeme.setTerminator(symbol);
                                break;

                            case LEXEME_TYPE.REGULAR:
                            case LEXEME_TYPE.STRING:
                                this.eFormatter(
                                    'PH_UNEXPECTED_QUOTE',
                                    this.layer.substring(this.phStartedAt, posInLayer),
                                    symbol,
                                    posInLayer
                                );
                                break;
                        }

                    } else if (symbol === OPEN_SQR_BRACKET) {

                    } else if (symbol === CLOSE_SQR_BRACKET) {

                    } else if (symbol === OPEN_PARENTHESIS) {

                    } else if (symbol === CLOSE_PARENTHESIS) {

                    } else if (symbol === DOT) {

                    } else if (symbol === COMMA) {

                    } else if (symbol === CARET) {

                    } else { // all other symbols

                    }

                    break;

                case STATUS.PH_STRING:
                    if (symbol === this.currentLexeme.getTerminator()) {
                        status = STATUS.PH_REGULAR;
                        delimiterType = DELIMITER_TYPE.NONE;
                        this.currentLexeme.marksTerminated();
                    } else if (symbol === escapeSymbol) {
                        if (escaping) {
                            this.currentLexeme.addToValue(symbol);
                        }
                        escaping = !escaping;
                    } else { // all other symbols
                        this.currentLexeme.addToValue(symbol);
                    }
                    break;

            }

            posInLayer += 1;
        }


    }

    getLastTopLevelLexeme(rootLexeme) {
        let currentLexeme = rootLexeme;
        while (currentLexeme.getNext()) {
            currentLexeme = currentLexeme.getNext();
        }

        return currentLexeme;
    }

    addLexemeAndPrepareNew(delimiterType) {
        let isNotPushed = true;
        let prevLexeme  = this.currentLexeme;
        let newLexeme   = new Lexeme();

        // First: push a previous lexeme to the layerList
        if (prevLexeme) {
            if (prevLexeme.isNotEmpty()) {
                switch (prevLexeme.getInsertType()) {
                    case INSERT_TYPE.CHILD:
                        prevLexeme.getParent().setChild(prevLexeme);
                        break;

                    case INSERT_TYPE.FIRST_ARG:
                        prevLexeme.getParent().setFirstArg(prevLexeme);
                        break;

                    case INSERT_TYPE.ROOT:
                        this.layerList.push(prevLexeme);
                        if (prevLexeme.getType() === LEXEME_TYPE.TEXT) {
                            this.rootLexeme = null;
                        } else {
                            this.rootLexeme = prevLexeme;
                        }
                        break;

                    case INSERT_TYPE.SIBLING:
                        prevLexeme.getPrev().setNext(prevLexeme);
                        break;
                }

                if ((prevLexeme.getType() === LEXEME_TYPE.STRING) && (prevLexeme.getTerminator() === A_QUOTE)) {
                    prevLexeme.setType(LEXEME_TYPE.REGULAR); // Acute quoted strings will be processed as regular
                }

                isNotPushed = false;
            } else {
                if (prevLexeme.getType() !== LEXEME_TYPE.TEXT) {
                    this.error = this.error || 'PH_TWO_DELIMITERS_IN_ROW';
                }
            }
        }

        // Second: calculate data for the new lexeme inserting
        switch (delimiterType) {

            case DELIMITER_TYPE.TEXT_STARTED:
                newLexeme.setType(LEXEME_TYPE.TEXT).setInsertType(INSERT_TYPE.ROOT);
                break;

            case DELIMITER_TYPE.PH_STARTED:
                newLexeme.setType(LEXEME_TYPE.REGULAR).setInsertType(INSERT_TYPE.ROOT);
                break;

            case DELIMITER_TYPE.NONE:
                this.error = this.error || 'PH_MISSING_DELIMITER';
                break;

            case DELIMITER_TYPE.BLANK:
                if (this.bracketStack.length > 0) {
                    this.error = this.error || 'PH_BLANK_BETWEEN_NESTED_LEXEMES';
                }

                prevLexeme = this.rootLexeme;
                if (prevLexeme) {
                    // find the last top-level lexeme
                    while (prevLexeme && prevLexeme.getNext()) {
                        prevLexeme = prevLexeme.getNext();
                    }

                }


        }

            this.currentLexeme = new Lexeme(newInsertType);
            switch (newInsertType) {
                case INSERT_TYPE.CHILD:
                case INSERT_TYPE.FIRST_ARG:
                    this.currentLexeme.setParent(prevLexeme);
                    break;

                case INSERT_TYPE.SIBLING:
                    this.currentLexeme.setPrev(prevLexeme);
                    break;
            }

            isNotProcessed = false;
        // } else {
        //     prevLexeme.init((prevLexeme.getInsertType() === INSERT_TYPE.ROOT) ? INSERT_TYPE.ROOT : newInsertType);
        // }

        return isNotProcessed;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
        return this;
    }

    addToBracketStack(value) {
        this.bracketStack.push(value);
        return this;
    }

    removeFromBracketStack() {
        return (this.bracketStack.length > 0) ? this.bracketStack.pop() : false;
    }

    getNewPosition() {
        return this.lastCheckedPos - 1;
    }

    getResult() {
        return this.result;
    }

    isResultNotEmpty() {
        return this.result.length > 0;
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
