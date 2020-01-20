/**
 * Lib "all-templates"
 * Placeholder parser.js
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const STATUS = {
    TEXT       : 1,
    PH_REGULAR : 2,
    PH_STRING  : 3,
    PH_RELATIVE: 4
};

const LEXEME_TYPE = {
    REGULAR: 1,
    STRING : 2,
    TEXT   : 3
};

const LEXEME_KIND = {
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
    CARET             = '^',
    DIGITS            = '0123456789';

const DELIMITER_TYPE = {
    TEXT_STARTED: 't',
    BLANK       : 'b',
    NONE        : 'n',
    OPEN_SQR_BRACKET,
    CLOSE_SQR_BRACKET,
    OPEN_PARENTHESIS,
    CLOSE_PARENTHESIS,
    DOT,
    COMMA
};

const LEVEL_REMOVING_DELIMITERS = [
    CLOSE_SQR_BRACKET,
    CLOSE_PARENTHESIS
];

const PAIRED_DELIMITERS = {
  CLOSE_SQR_BRACKET: OPEN_SQR_BRACKET,
  CLOSE_PARENTHESIS: OPEN_PARENTHESIS
};

const SWALLOWED_DELIMITERS = [
   DELIMITER_TYPE.NONE,
   DELIMITER_TYPE.BLANK
];

const REGULAR_DELIMITERS = [
    OPEN_SQR_BRACKET,
    OPEN_PARENTHESIS,
    DOT,
    COMMA
];

const INSERT_TYPE = {
    ROOT     : 0,
    SIBLING  : 1,
    FIRST_ARG: 2,
    CHILD    : 3
};

const DELIMITERS = Object.values(DELIMITER_TYPE);

const OPERATORS = {
    INSERT:  '=',
    IF:      'if',
    UNLESS:  'unless',
    ELSE:    'else',
    ELSIF:   'elsif',
    END:     'end',
    COMMENT: '#'
};

const OPS_VALUES = Object.values(OPERATORS);

const NODE_TYPE = {
    TEXT: 't',
    ...OPERATORS
};

class ControlTree {

}

class ControlBlock {
    constructor() {
        this.nodes = [];
    }
}

class ControlNode {
    constructor(nodeType, lexeme) {
        this.nodeType = nodeType;
        this.data = lexeme;
    }
}

class Lexeme {
    constructor() {
        this.value            = '';
        this.firstArg         = null;
        this.child            = null;
        this.parent           = null;
        this.prev             = null;
        this.next             = null;
        this.terminator       = null;
        this.kind             = null;
        this.willBeInsertedAs = null;
        this.phStartedAt      = null;
        this.type             = LEXEME_TYPE.REGULAR;

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

    setPhStartedAt(position) {
        this.phStartedAt = position;
        return this;
    }

    getPhStartedAt() {
        return this.phStartedAt;
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
        this.levels = null;
        this.openPh = renderData.openPh;
        this.openPhMaxPosition = renderData.openPh.length - 1;
        this.closePh = renderData.closePh;
        this.closePhMaxPosition = renderData.closePh.length - 1;
        this.lastCheckedPos = -1;
        this.layerList = [];
        this.status = STATUS.TEXT;
        this.currentLexeme = false;
        this.delimiter = DELIMITER_TYPE.TEXT_STARTED;

        return this;
    }

    getLastPhPosition() {
        const lexemes = (this.levels.length > 0)
            ? this.levels[this.levels.length - 1].lexemes
            : [];
        return (lexemes.length > 0) ? lexemes[lexemes.length - 1].getPhStartedAt() : -1;
    }

    addLexToCurLevel(lexeme) {
        this.levels[this.levels.length - 1].lexemes.push(lexeme);
    }

    addLexToNewLevel(lexeme, delimiter) {
        this.levels.push({ delimiter: delimiter, lexemes: [lexeme] });
    }

    getLastChain() {
        const lexemes = (this.levels.length > 0) ? this.levels[this.levels.length - 1].lexemes : [];
        return (lexemes.length > 0) ? lexemes[lexemes.length - 1] : null;
    }
    
    getLastLexeme() {
        let lexeme = this.getLastChain();
        while (lexeme && lexeme.getChild()) {
            lexeme = lexeme.getChild;
        }
        return lexeme;
    }

    insertLexemeIntoTree () {
        const lexeme = this.currentLexeme;
        let relatedLexeme;

        // First: insert the lexeme
        if (lexeme) {
            if (lexeme.isNotEmpty()) {
                switch (lexeme.getInsertType()) {
                    case INSERT_TYPE.CHILD:
                        relatedLexeme = this.getLastLexeme();
                        lexeme.setParent(relatedLexeme);
                        relatedLexeme.setChild(lexeme);
                        break;

                    case INSERT_TYPE.FIRST_ARG:
                        relatedLexeme = this.getLastLexeme();
                        if (relatedLexeme) {
                            lexeme.setParent(relatedLexeme);
                            relatedLexeme.setFirstArg(lexeme).setKind(LEXEME_KIND.FUNCTION);
                            this.addLexToNewLevel(lexeme);
                        } else {
                            this.error = this.error || 'PH_ARG_WITHOUT_FUNC_NAME';
                        }
                        break;

                    case INSERT_TYPE.ROOT:
                        this.layerList.push(lexeme);
                        this.addLexToNewLevel(lexeme, DELIMITER_TYPE.BLANK);
                        break;

                    case INSERT_TYPE.SIBLING:
                        relatedLexeme = this.getLastChain();
                        lexeme.setPrev(relatedLexeme);
                        relatedLexeme.setNext(lexeme);
                        this.addLexToCurLevel(lexeme);
                        break;
                }

                if ((lexeme.getType() === LEXEME_TYPE.STRING) && (lexeme.getTerminator() === A_QUOTE)) {
                    lexeme.setType(LEXEME_TYPE.REGULAR); // Acute quoted strings will be processed as regular
                }

            } else {
                if ((lexeme.getType() !== LEXEME_TYPE.TEXT) && (lexeme.getKind() !== LEXEME_KIND.ARG_OF_FUNC)) {
                    this.error = this.error || 'PH_TWO_DELIMITERS_IN_ROW';
                }
            }
        }

        // Second: correct levels if necessary
        if (this.removingDelimiter) {
            if (this.levels.length > 0) {
                let lastLevel = this.levels.pop();
                if (lastLevel.delimiter !== PAIRED_DELIMITERS[this.removingDelimiter]) {
                    this.error = this.error || 'PH_UNBALANCED_BRACKETS';
                }
            } else {
                this.error = this.error || 'PH_UNBALANCED_BRACKETS';
            }

            this.removingDelimiter = null;
        }

    }

    addLexemeAndPrepareNew() {
        let prevLexeme  = this.currentLexeme;
        let newLexeme   = new Lexeme();

        // First: push a previous lexeme into the Layer List
        this.insertLexemeIntoTree();

        // Second: New lexeme preparing
        switch (this.delimiter) {
            case DELIMITER_TYPE.TEXT_STARTED:
                newLexeme.setType(LEXEME_TYPE.TEXT).setInsertType(INSERT_TYPE.ROOT);
                break;

            case DELIMITER_TYPE.NONE:
                this.error = this.error || 'PH_MISSING_DELIMITER';
                break;

            case DELIMITER_TYPE.BLANK:
                prevLexeme = this.getLastChain();
                if (prevLexeme) {
                    if (this.levels.length > 0) {
                        this.error = this.error || 'PH_BLANK_BETWEEN_NESTED_LEXEMES';
                    }
                    newLexeme.setInsertType(INSERT_TYPE.SIBLING);
                } else {
                    newLexeme.setInsertType(INSERT_TYPE.ROOT);
                }
                break;

            case DELIMITER_TYPE.OPEN_PARENTHESIS:
                newLexeme.setInsertType(INSERT_TYPE.FIRST_ARG)
                    .setKind(LEXEME_KIND.ARG_OF_FUNC)
                    .setParent(prevLexeme);
                break;

            case DELIMITER_TYPE.DOT:
                newLexeme.setInsertType(INSERT_TYPE.CHILD);
                break;

            case DELIMITER_TYPE.OPEN_SQR_BRACKET:
                newLexeme.setInsertType(INSERT_TYPE.CHILD).setKind(LEXEME_KIND.EL_OF_ARRAY);
                break;

            case DELIMITER_TYPE.COMMA:
                newLexeme.setInsertType(INSERT_TYPE.SIBLING);
                break;
        }

        this.currentLexeme = newLexeme;
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
        this.currentLexeme = new Lexeme();

        const layerLength = this.layer.length;
        let lexemeNotStarted;
        let escaping = false;

        while (posInLayer < layerLength) {
            // abcd"[]{}efg {{if abc.`def`.^2.kl(dbe["as"].klm.`ufh`, "{{}}"}}

            const symbol = this.layer[posInLayer];

            switch (status) {
                case STATUS.TEXT:
                    if (symbol === this.openPh[this.buffer.length]) {
                        if (this.buffer.length === this.openPhMaxPosition) {
                            this.delimiter = DELIMITER_TYPE.BLANK;
                            this.removingDelimiter = null;
                            this.currentLexeme.setValue(this.result)
                                .setType(LEXEME_TYPE.TEXT)
                                .setInsertType(INSERT_TYPE.ROOT);
                            this.buffer = this.result = '';
                            lexemeNotStarted = true;
                            this.levels = [];
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
                            this.buffer = this.result = '';
                            this.delimiter = DELIMITER_TYPE.TEXT_STARTED;
                            this.addLexemeAndPrepareNew();
                            if (this.levels.length > 1) {
                                this.error = this.error || 'PH_UNBALANCED_BRACKETS';
                            }
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
                        if (this.delimiter === DELIMITER_TYPE.NONE) {
                            this.delimiter = DELIMITER_TYPE.BLANK;
                            lexemeNotStarted = true;
                        }

                    } else if (QUOTES.includes(symbol)) { // quoted lexeme is started
                        this.addLexemeAndPrepareNew();
                        this.currentLexeme.setType(LEXEME_TYPE.STRING).setTerminator(symbol);
                        status = STATUS.PH_STRING;

                    } else if (REGULAR_DELIMITERS.includes(symbol)) {
                        if (SWALLOWED_DELIMITERS.includes(this.delimiter)) {
                            this.delimiter = symbol;
                        } else {
                            this.error = this.error || 'PH_TWO_DELIMITERS_IN_ROW';
                        }
                        lexemeNotStarted = true;

                    } else if (LEVEL_REMOVING_DELIMITERS.includes(symbol)) {
                        this.removingDelimiter = symbol;
                        this.delimiter = DELIMITER_TYPE.NONE;
                        lexemeNotStarted = true;

                    } else if (symbol === CARET) {
                        this.addLexemeAndPrepareNew();
                        this.currentLexeme.setKind(LEXEME_KIND.RELATIVE);
                        status = STATUS.PH_RELATIVE;
                    } else { // all other symbols
                        if (lexemeNotStarted) {
                            this.addLexemeAndPrepareNew();
                            lexemeNotStarted = false;
                        }
                        this.currentLexeme.addToValue(symbol);
                    }

                    break;

                case STATUS.PH_STRING:
                    if (symbol === this.currentLexeme.getTerminator()) {
                        if (this.currentLexeme.isEmpty()) {
                            this.error = this.error || 'PH_EMPTY_STRING';
                        }
                        this.delimiter = DELIMITER_TYPE.NONE;
                        lexemeNotStarted = true;
                        status = STATUS.PH_REGULAR;
                    } else if (symbol === escapeSymbol) {
                        if (escaping) {
                            this.currentLexeme.addToValue(symbol);
                        }
                        escaping = !escaping;
                    } else { // all other symbols
                        if (lexemeNotStarted) {
                            this.addLexemeAndPrepareNew();
                            lexemeNotStarted = false;
                        }
                        this.currentLexeme.addToValue(symbol);
                    }
                    break;

                case STATUS.PH_RELATIVE:
                    if (DIGITS.includes(symbol)) {
                        this.currentLexeme.addToValue(symbol);
                    } else {
                        this.delimiter = DELIMITER_TYPE.NONE;
                        posInLayer -= 1;
                        status = STATUS.PH_REGULAR;
                    }
                    break;
            }

            posInLayer += 1;
        }

        if (status === STATUS.TEXT) {
            this.insertLexemeIntoTree();
        } else {
            this.error = this.error || 'PH_UNTERMINATED_PLACEHOLDER'
        }

    }
}

const emitThrow = function(excName, layerName, fullEntry, symbol, position, modules) {
    const { E: {Exceptions, Throw} } = modules;
    Throw(
        Exceptions[excName],
        `[layer: ${layerName}, placeholder: ${fullEntry}, symbol: ${symbol}, position: ${position}]`
    );
};
