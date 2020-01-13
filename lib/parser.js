/**
 * Lib "all-templates"
 * Placeholder parser.js
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
    TEXT            : 0,
    PH_MAYBE_BLANK  : 1,
    PH_LEXEME_QUOTED: 2,
    PH_LEXEME_BARE  : 3
};

const LEXEME_TYPE = {
    REGULAR: 0,
    STRING : 1,
    UNKNOWN: 2,
    TEXT   : 3
};

const LEXEME_KIND = {
    REGULAR      : 0,
    EL_OF_ARRAY  : 1,
    FLOAT        : 2,
    FUNCTION     : 3,
    ARG_OF_FUNC  : 4
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

const CLOSE_STATUS = {
    IN_PROGRESS: 0,
    CLOSED     : 1,
    STILL_OPEN : 2,
    GO_TO      : 3
};

const INSERT_TYPE = {
    ROOT   : 0,
    SIBLING: 1,
    ARG    : 2,
    CHILD  : 3
};


class Lexeme {
    constructor(accumulator, willBeInsertedAs, rootLexeme, rootOfChain) {
        this.accumulator = accumulator;
        this.value = '';
        this.type  = LEXEME_TYPE.UNKNOWN;
        this.kind  = LEXEME_KIND.REGULAR;
        this.firstArg  = false;
        this.child = false;
        this.parent = false;
        this.prev = false;
        this.next = false;
        this.rootOfChain = rootOfChain || this;
        this.rootLexeme = rootLexeme || this;
        this.firstSibling = false;
        this.willBeInsertedAs = willBeInsertedAs;

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

    isNotEmpty() {
       return this.value > 0;
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

    getRootOfChain() {
        return this.rootOfChain;
    }

    setRootOfChain(lexeme) {
        this.rootOfChain = lexeme;
        return this;
    }

    isRootOfChain() {
        return this.rootOfChain === this;
    }

    getRootLexeme() {
        return this.rootLexeme;
    }

    setRootLexeme(lexeme) {
        this.rootLexeme = lexeme;
        return this;
    }

    isRootLexeme() {
        return this.rootLexeme === this;
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

    getInsertType() {
        return this.willBeInsertedAs;
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
                break;

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
        this.currentLexeme = new Lexeme(this, INSERT_TYPE.ROOT);

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

        const layerLength = this.layer.length;
        let accumulator = new Accumulator(openPh, closePh);
        let delimiterType = false;

        let phStartedAt = -1;
        while (posInLayer < layerLength) {
            // abcd"[]{}efg {{if abc.`def`.^2.kl(dbe["as"].klm.`ufh`, "{{}}"}}

            const symbol = this.layer[posInLayer];

            switch (status) {
                case STATUS.TEXT:
                    if (this.addValAndCheckOpenPh(symbol)) { // if placeholder is opened
                        if (this.result.length > 0) {
                            this.currentLexeme.setValue(this.result).setType(LEXEME_TYPE.TEXT);
                            this.layerList.push(this.currentLexeme); // add the text chunk to layerList
                        }

                        this.buffer = this.result = '';
                        this.currentLexeme = new Lexeme(this, INSERT_TYPE.ROOT);
                        this.phStartedAt = posInLayer - openPh.length;

                        status = STATUS.PH_MAYBE_BLANK;
                        delimiterType = false;
                    }
                    break;

                case STATUS.PH_MAYBE_BLANK:
                    let closingStatus = this.checkClosePh(symbol, posInLayer);

                    if (closingStatus === CLOSE_STATUS.CLOSED) { // the placeholder is closed
                        this.addLexeme(this.currentLexeme);
                        if (this.rootLexeme.getType() === LEXEME_TYPE.UNKNOWN) {
                            this.eFormatter(
                                'PH_IS_EMPTY',
                                this.layer.substring(this.phStartedAt, posInLayer),
                                symbol,
                                0
                            );
                        }

                        this.currentLexeme = this.currentChain = this.rootLexeme =
                            new Lexeme(this).setType(LEXEME_TYPE.TEXT);
                        this.buffer = this.result = '';
                        status = STATUS.TEXT;
                        break;
                    }
                    if (closingStatus === CLOSE_STATUS.IN_PROGRESS) {
                        break;
                    }
                    if (closingStatus === CLOSE_STATUS.GO_TO) {
                        this.posInLayer = this.lastCheckedPos - 1;
                        break;
                    }

                    // closingStatus === CLOSE_STATUS.STILL_OPEN
                    if (BLANKS.includes(symbol)) {
                        delimiterType = delimiterType || DELIMITER_TYPE.BLANK;
                    } else {
                        if (QUOTES.includes(symbol)) {
                            if (delimiterType === DELIMITER_TYPE.BLANK) {
                                if (this.bracketStack.length > 0) {
                                    this.eFormatter(
                                        'PH_BLANK_BETWEEN_NESTED_LEXEMES',
                                        this.layer.substring(this.phStartedAt, posInLayer),
                                        symbol,
                                        posInLayer
                                    )
                                }
                            }

                        }

                    }

            }

            posInLayer += 1;
        }


    }

    pushRootToLayerListOnce(lexeme) {
        const layerListLength = this.layerList.length;

        if (this.getLastLayerElement() !== lexeme.getRootLexeme()) {
            this.layerList.push(lexeme.getRootLexeme());
        }
    }

    getLastLayerElement() {
        const lastIndex = this.layerList.length - 1;
        if (lastIndex < 0) {
            return null;
        } else {
            return this.layerList[lastIndex];
        }
    }

    addLexeme(lexeme) {
        if (lexeme.getType() !== LEXEME_TYPE.UNKNOWN) {
            let rootOfChain = lexeme.getRootOfChain();

            switch (lexeme.getInsertType()) {
                case INSERT_TYPE.ROOT:
                    this.pushRootToLayerListOnce(lexeme);
                    break;

                case INSERT_TYPE.CHILD:
                    // 1. add current lexeme to it's chain
                    lexeme.getParent().setChild(lexeme);
                    // 2. add chain to it's prev sibling or add chain to layerList
                    if (rootOfChain.getInsertType() === INSERT_TYPE.ROOT) {
                        this.pushRootToLayerListOnce(rootOfChain);
                    } else { // rootOfChain.insetType === SIBLING
                        rootOfChain.getPrev().setNext(rootOfChain);
                    }
                    break;

                case INSERT_TYPE.SIBLING:
                    // 1. add chain to it's prev sibling
                    rootOfChain.getPrev().setNext(rootOfChain);
                    break;

                case INSERT_TYPE.ARG:
                    let functionLexeme = lexeme.getRootOfChain().getParent();
                    if (functionLexeme.getFirstArg()) {
                        rootOfChain().getPrev().setNext(rootOfChain);
                    } else {
                        functionLexeme.setFirstArg(rootOfChain);
                    }
                    break;
            }

        }
    }

    createNewChain() {
        if () {

        }
        let newLexeme = new Lexeme(this, this.currentLexeme.getRootLexeme());
        let insertPoint =

    }


    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
        return this;
    }

    addToLayerIfNotEmpty(lexeme) {
        if ((this.currentLexeme.getType() !== LEXEME_TYPE.TEXT) || this.currentLexeme.isNotEmpty()) {
            this.layerList.push(lexeme);
        }

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
                if (accumulator.addValAndCheckOpenPh(symbol)) { // if placeholder is opened
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