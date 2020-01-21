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

class ControlTree {
    constructor() {
        this.rootBlock = this.currentBlock = new ControlBlock(null, this);
        this.operatorsToChecking = {};
        this.errors = [];
    }

    addToTree(lexeme) {
        let node, operator;

        if (lexeme.getType() === LEXEME_TYPE.TEXT) {
            node = new ControlNode(NODE_TYPE.TEXT, lexeme, this);
            this.currentBlock.addNode(node);
        } else {
            operator = lexeme.getValue();
            if (operator === OPERATORS.INSERT) {
                node = new ControlNode(OPERATORS.INSERT, lexeme, this);
                this.currentBlock.addNode(node);

            } else if (operator.localeCompare(OPERATORS.IF, 'en', {sensitivity: 'accent'})) {
                node = new ControlNode(OPERATORS.IF, lexeme, this);
                this.currentBlock.addNode(node);
                node.initIfUnlessNode(false);

            } else if (operator.localeCompare(OPERATORS.UNLESS, 'en', {sensitivity: 'accent'})) {
                node = new ControlNode(OPERATORS.IF, lexeme, this);
                this.currentBlock.addNode(node);
                node.initIfUnlessNode(true);
            }
        }
    }

    addToOpsToChecking(controlNode) {
        let index = Object.keys(this.operatorsToChecking).length.toString();
        this.operatorsToChecking[index] = controlNode;
        controlNode.setIndexToChecking(index);
    }

    removeFromOpsToChecking(index) {
        delete this.operatorsToChecking[index];
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
}


module.exports = ControlTree;
