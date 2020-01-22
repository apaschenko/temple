/**
 * Lib "all-templates"
 * Root class of Layer parser
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlTree = require('./control_tree');
const Lexeme      = require('./lexeme');

const {
    SYMBOL: {
        BLANKS,
        QUOTES,
        A_QUOTE,
        OPEN_SQR_BRACKET,
        CLOSE_SQR_BRACKET,
        OPEN_PARENTHESIS,
        CLOSE_PARENTHESIS,
        DOT,
        COMMA,
        CARET,
        DIGITS,
        HASH
    },
    DELIMITER,
    LEXEME_TYPE,
    LEXEME_KIND
} = require('../constants/internal_definitions');


const STATUS = {
    TEXT      : 1,
    PH_REGULAR: 2,
    PH_STRING : 3,
    PH_NUMBER : 4,
    PH_COMMENT: 5
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
    DELIMITER.NONE,
    DELIMITER.BLANK
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

class Parser {
    constructor(renderData, layerName, layer, layerIsLiteral) {
        this.renderData = renderData;
        this.layerName = layerName;
        this.layer = layer;
        this.layerIsLiteral = layerIsLiteral;
        this.buffer = '';
        this.result = '';
        this.levels = null;
        this.lastCheckedPos = -1;
        this.currentLexeme = false;
        this.delimiter = DELIMITER.TEXT_STARTED;
        this.controlTree = new ControlTree(renderData.options, layerName, this.layerIsLiteral ? layer : false);

        return this;
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

    insertLexeme () {
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
                            this.error = this.error || {
                                name: 'PH_ARG_WITHOUT_FUNC_NAME',
                                symbols: lexeme.getValue()
                            };
                        }
                        break;

                    case INSERT_TYPE.ROOT:
                        this.controlTree.addToTree(lexeme);
                        this.addLexToNewLevel(lexeme, DELIMITER.BLANK);
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
                    this.error = this.error || { name: 'PH_TWO_DELIMITERS_IN_ROW' };
                }
            }
        }

        // Second: correct levels if necessary
        if (this.removingDelimiter) {
            if (this.levels.length > 1) {
                let lastLevel = this.levels.pop();
                if (lastLevel.delimiter !== PAIRED_DELIMITERS[this.removingDelimiter]) {
                    this.error = this.error || {
                        name   : 'PH_UNBALANCED_BRACKETS',
                        symbols: `"${lastLevel.delimiter} ... ${this.removingDelimiter}"`
                    };
                }
            } else {
                this.error = this.error || {
                    name   : 'PH_UNBALANCED_BRACKETS',
                    symbols: `"${this.removingDelimiter}" is not preceded by ` +
                        `"${PAIRED_DELIMITERS[this.removingDelimiter]}"`
                };
            }

            this.removingDelimiter = null;
        }

    }

    addLexemeAndPrepareNew() {
        let prevLexeme  = this.currentLexeme;
        let newLexeme   = new Lexeme();

        // First: push a previous Lexeme into Lexical Tree
        this.insertLexeme();

        // Second: New lexeme preparing
        switch (this.delimiter) {
            case DELIMITER.TEXT_STARTED:
                newLexeme.setType(LEXEME_TYPE.TEXT).setInsertType(INSERT_TYPE.ROOT);
                break;

            case DELIMITER.NONE:
                this.error = this.error || {
                    name    : 'PH_MISSING_DELIMITER',
                    location: `between "${prevLexeme.value()}" and next lexeme`
                };
                break;

            case DELIMITER.BLANK:
                prevLexeme = this.getLastChain();
                if (prevLexeme) {
                    if (this.levels.length > 0) {
                        this.error = this.error || {
                            name    : 'PH_BLANK_BETWEEN_NESTED_LEXEMES',
                            location: `between "${this.getLastLexeme().getValue()}" and next lexeme`
                        };
                    }
                    newLexeme.setInsertType(INSERT_TYPE.SIBLING);
                } else {
                    newLexeme.setInsertType(INSERT_TYPE.ROOT);
                }
                break;

            case DELIMITER.OPEN_PARENTHESIS:
                newLexeme.setInsertType(INSERT_TYPE.FIRST_ARG)
                    .setKind(LEXEME_KIND.ARG_OF_FUNC)
                    .setParent(prevLexeme);
                break;

            case DELIMITER.DOT:
                newLexeme.setInsertType(INSERT_TYPE.CHILD);
                break;

            case DELIMITER.OPEN_SQR_BRACKET:
                newLexeme.setInsertType(INSERT_TYPE.CHILD).setKind(LEXEME_KIND.EL_OF_ARRAY);
                break;

            case DELIMITER.COMMA:
                newLexeme.setInsertType(INSERT_TYPE.SIBLING);
                break;
        }

        this.currentLexeme = newLexeme;
    }

    parse() {
        const { options: { placeholder, escapeSymbol} } = this.renderData;
        let posInLayer = 0;
        let status = STATUS.TEXT;
        this.currentLexeme = new Lexeme();

        const layerLength = this.layer.length;
        let lexemeNotStarted;
        let escaping = false;
        let phStartedAt = -1;

        while (posInLayer < layerLength) {
            // abcd"[]{}efg {{if abc.`def`.^2.kl(dbe["as"].klm.`ufh`, "(( # empty ph ))"}}

            const symbol = this.layer[posInLayer];

            switch (status) {
                case STATUS.TEXT:
                    if (symbol === placeholder.open[this.buffer.length]) {
                        if (this.buffer.length === this.renderData.openPhMaxPosition) {
                            this.delimiter = DELIMITER.BLANK;
                            this.removingDelimiter = null;
                            this.currentLexeme.setValue(this.result)
                                .setType(LEXEME_TYPE.TEXT)
                                .setInsertType(INSERT_TYPE.ROOT);
                            this.buffer = this.result = '';
                            lexemeNotStarted = true;
                            this.levels = [];
                            phStartedAt = posInLayer - this.renderData.openPhMaxPosition;
                            status = STATUS.PH_REGULAR;
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
                    if ((this.lastCheckedPos < posInLayer)
                        && (symbol === placeholder.close[bufferLength])
                    ) {
                        if (0 === bufferLength) {
                            this.lastCheckedPos = posInLayer;
                        }

                        if (bufferLength === this.renderData.closePhMaxPosition) {
                            this.buffer = this.result = '';
                            this.delimiter = DELIMITER.TEXT_STARTED;
                            this.addLexemeAndPrepareNew();
                            this.checkToUnclosedBracketsError();
                            this.checkToPhErrors(phStartedAt, posInLayer, this.layer, this.layerName);
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
                        if (this.delimiter === DELIMITER.NONE) {
                            this.delimiter = DELIMITER.BLANK;
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
                            this.error = this.error || {
                                name   : 'PH_TWO_DELIMITERS_IN_ROW',
                                symbols: `"${this.delimiter}" and "${symbol}"`
                            };
                        }
                        lexemeNotStarted = true;

                    } else if (LEVEL_REMOVING_DELIMITERS.includes(symbol)) {
                        this.removingDelimiter = symbol;
                        this.delimiter = DELIMITER.NONE;
                        lexemeNotStarted = true;

                    } else if (symbol === CARET) {
                        this.addLexemeAndPrepareNew();
                        this.currentLexeme.setKind(LEXEME_KIND.RELATIVE);
                        status = STATUS.PH_NUMBER;

                    } else if (symbol === HASH) {
                        status = STATUS.PH_COMMENT;

                    } else { // all other symbols
                        if (lexemeNotStarted) {
                            this.addLexemeAndPrepareNew();
                            lexemeNotStarted = false;
                            if (DIGITS.includes(symbol)) {
                                this.currentLexeme.addToValue(symbol).setType(LEXEME_TYPE.NUMBER);
                                status = STATUS.PH_NUMBER;
                            }
                        }
                        this.currentLexeme.addToValue(symbol);
                    }

                    break;

                case STATUS.PH_STRING:
                    if (symbol === this.currentLexeme.getTerminator()) {
                        if (this.currentLexeme.isEmpty()) {
                            this.error = this.error || {
                                name : 'PH_EMPTY_STRING',
                                value: `${this.currentLexeme.getTerminator()}${this.currentLexeme.getTerminator()}`
                            };
                        }
                        this.delimiter = DELIMITER.NONE;
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

                case STATUS.PH_NUMBER:
                    if (DIGITS.includes(symbol)) {
                        this.currentLexeme.addToValue(symbol);
                    } else {
                        this.delimiter = DELIMITER.NONE;
                        posInLayer -= 1;
                        status = STATUS.PH_REGULAR;
                    }
                    break;

                case STATUS.PH_COMMENT:
                    break;
            }

            posInLayer += 1;
        }

        if (status === STATUS.TEXT) {
            this.insertLexeme();
        } else {
            this.controlTree.addError({
                name       : 'PH_UNTERMINATED_PLACEHOLDER' ,
                placeholder: this.layer.substring(phStartedAt, phStartedAt + 16) + '...',
                layer      : this.layerName
            });
            this.checkToPhErrors(phStartedAt, phStartedAt + 20)
        }

        this.controlTree.checkForErrors();
        return this.controlTree.getRootBlock();
    }

    checkToUnclosedBracketsError() {
        if (this.levels.length > 1) {
            this.levels.shift();
            this.error = this.error || {
                name   : 'PH_UNCLOSED_BRACKETS',
                symbols:  this.levels.map(function(v) {return `"${v.delimiter}..."`}).join(', ')
            };
        }
    }

    checkToPhErrors(phStartedAt, posInLayer, layer, layerName) {
        if (this.error) {
            this.error.placeholder = `"layer.substring(phStartedAt, posInLayer + 1)"`;
            this.controlTree.addError(this.error);
            this.error = null;
        }
    }
}

module.exports = Parser;
