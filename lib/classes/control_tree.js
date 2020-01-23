/**
 * Lib "all-templates"
 * ControlTree: a class for the parser results building.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


const ControlNode  = require('./control_node');
const ControlBlock = require('./control_block');
const { LEXEME_TYPE, NODE_TYPE, OPERATORS } = require('../constants/internal_definitions');
const { Exceptions, ErrorName, Throw } = require('../exceptions');
const { chunkString } = require('../utils/general');

class ControlTree {
    constructor(renderData, layerName, layer) {
        this.rootBlock = this.currentBlock = new ControlBlock(null, this, 'root');
        this.operatorsToChecking = {};
        this.errors = [];
        this.renderData = renderData;
        this.layerName = layerName;
        this.layer = layer;
        this.nodeIndex = 0;
        this.blockIndex = 0;
    }

    addToTree(lexeme) {
        let node, operator;

        if (lexeme.getType() === LEXEME_TYPE.TEXT) {
            node = new ControlNode(NODE_TYPE.TEXT, lexeme, this, this.nodeIndex++);
            this.currentBlock.addNode(node);
        } else {
            operator = lexeme.getValue();
            if (operator === OPERATORS.INSERT) {
                node = new ControlNode(OPERATORS.INSERT, lexeme, this, this.nodeIndex++);
                this.currentBlock.addNode(node);

            } else if (operator.localeCompare(OPERATORS.IF, 'en', {sensitivity: 'accent'})) {
                node = new ControlNode(OPERATORS.IF, lexeme, this, this.nodeIndex++);
                this.currentBlock.addNode(node);
                node.initIfUnlessNode(false);

            } else if (operator.localeCompare(OPERATORS.UNLESS, 'en', {sensitivity: 'accent'})) {
                node = new ControlNode(OPERATORS.IF, lexeme, this, this.nodeIndex++);
                this.currentBlock.addNode(node);
                node.initIfUnlessNode(true);
            }
        }
    }

    addToOpsToChecking(controlNodeName) {
        this.operatorsToChecking[controlNodeName] = true;
    }

    removeFromOpsToChecking(controlNodeName) {
        delete this.operatorsToChecking[controlNodeName];
    }

    setCurrentBlock(controlBlock) {
        this.currentBlock = controlBlock;
    }

    addError(error) {
        this.errors.push(error);
    }

    addErrorIfNone(errorName) {
        if (this.errors.length === 0) {
            this.errors.push({ name: errorName });
        }
    }

    getRootBlock() {
        return this.rootBlock;
    }

    formatSingleError(error) {
        const { options: { printError: {lineSeparator, indentation, maxWidth} } } = this.renderData;
        let err = { ...error };
        err.description = ErrorName[err.name] || '---';

        let output = chunkString(`Error: ${err.name}`, maxWidth, indentation, lineSeparator) + lineSeparator;
        delete err.name;

        let keys = Object.keys(err);
        for (let key of keys) {
            output += chunkString(`${indentation}${key}: ${err[key]}`, maxWidth, indentation, lineSeparator)
                + lineSeparator;
        }
        output += lineSeparator;
        return output;
    }

    checkForErrors() {
        const { options: { printError: {lineSeparator, indentation, maxWidth} } } = this.renderData;
        let output = '';

        if (this.operatorsToChecking.length > 0) {
            this.errors.push({ name: 'UNTERMINATED_OPERATORS' });
        }

        for (let error of this.errors) {
            output += this.formatSingleError(error);
        }

        if (output.length > 0) {
            output = lineSeparator + lineSeparator
                + lineSeparator + chunkString(ErrorName.HEADER, maxWidth, indentation, lineSeparator)
                + lineSeparator
                + ( (this.layer === false)
                        ? `[Layer: "${this.layerName}"]`
                        : `[String Literal "${this.layer}" which build-in into the "${this.layerName}"]`
                )
                + `${lineSeparator}${lineSeparator}${output}`;
            Throw(Exceptions.PARSING_ERRORS, output);
        }
    };

    printDebug() {
        const { options: { printError: {lineSeparator} } } = this.renderData;
        Throw(
            Exceptions.DEBUG,
            `${lineSeparator}${lineSeparator}` + this.printDebugBlock(this.rootBlock, '')
        );
    }

    printDebugBlock(block, indent) {

        const { options: { printError: {lineSeparator, indentation} } } = this.renderData;
        let output = `${indent}[${block.getName()}]   `
            + `parent: ${block.getParent() || '--- has no parent ---'}`;
        let newIndent = `${indent}${indentation}${indentation}`;
        for (let node of block.getNodes()) {
            output += this.printDebugNode(node, newIndent) + `${lineSeparator}${lineSeparator}`;
        }
        return output;
    }

    printDebugNode(node, indent) {
        let output;
        if (node) {
            const {options: {printError: {lineSeparator, indentation}}} = this.renderData;
            let newIndent = `${indent}${indentation}${indentation}`;
            output = `${lineSeparator}${indent}[${node.getName()}]`;
            let data = node.getData() ? this.printDebugLexeme(node.getData(), newIndent) : '--- missing ---';
            output += `${lineSeparator}${indent}data: ${data}${lineSeparator}`;
        } else {
            output = '--- missing node ---';
        }

        return output;
    }

    printDebugLexeme(lexeme, indent) {
        let output;
        if (lexeme) {
            const {options: {printError: {lineSeparator, indentation}}} = this.renderData;
            let prev, next, firstArg, child;
            let newIndent = `${indent}${indentation}${indentation}`;
            output = `${lineSeparator}${indent}[${lexeme.getName()}]${lineSeparator}`
                + `${indent}value: ${lexeme.getValue()}${lineSeparator}`;
            prev = lexeme.getPrev();
            output += `${indent}prev: ${prev ? prev.getName() : '--- none ---'}${lineSeparator}`
                + `${indent}next: ${this.printDebugLexeme(lexeme.getNext(), newIndent)}${lineSeparator}`
        } else {
            output = '--- none ---'
        }
        return output;
    }
}


module.exports = ControlTree;
