/**
 * Lib "all-templates"
 * ControlNode: a class for the parser results construction.
 * It represents a single node (text chunk or an operator).
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlBlock = require('./control_block');

const IF_UNLESS_STATUS = {
    THEN : 1,
    ELSE : 2,
    ENDED: 3
};


class ControlNode {
    constructor(nodeType, lexeme, controlTree) {
        this.nodeType = nodeType;
        this.data = lexeme;
        this.controlTree = controlTree;
        return this;
    }

    setBlock(controlBlock) {
        this.block = controlBlock;
        return this;
    }

    getBlock() {
        return this.block;
    }

    initIfUnlessNode(isNeedToRevert) {
        let controlTree = this.controlTree;
        this.truePath = new ControlBlock(this, controlTree);
        this.falsePath = new ControlBlock(this, controlTree);
        this.opStatus = isNeedToRevert ? IF_UNLESS_STATUS.ELSE : IF_UNLESS_STATUS.THEN;
        this.isNeedToRevert = isNeedToRevert;
        controlTree.setCurrentBlock(isNeedToRevert ? this.falsePath : this.truePath);
        controlTree.addToOpsToChecking(this);
    }

    setIndexToChecking(index) {
        this.indexToChecking = index;
    }

    switchToElsePath() {
        let newPath;
        switch (this.opStatus) {
            case IF_UNLESS_STATUS.THEN:
                this.controlTree.setCurrentBlock(this.isNeedToRevert ? this.truePath : this.falsePath);
                this.opStatus = IF_UNLESS_STATUS.ELSE;
                break;
            case IF_UNLESS_STATUS.ELSE:
                this.controlTree.addErrorIfNone('FLOW_TWO_ELSE_IN_ROW');
                break;
            case IF_UNLESS_STATUS.ENDED:
                this.controlTree.addError({ name: 'INTERNAL_PARSER_ERROR', code: 'Illegal op status'});
                break;
        }
    }

    finalizeIfUnless() {
        this.opStatus = IF_UNLESS_STATUS.ENDED;
        this.controlTree.setCurrentBlock(this.block);
    }
}


module.exports = ControlNode;
