/**
 * Lib "all-templates"
 * ControlBlock: a class for the grouping of ControlNode by levels.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


class ControlBlock {
    constructor(parentNode, controlTree) {
        this.nodes = [];
        this.parent = parentNode;
        this.controlTree = controlTree;
    }

    getParent() {
        return this.parent;
    }

    addNode(controlNode) {
        this.nodes.push(controlNode);
        controlNode.setBlock(this);
    }

    getControlTree() {
        return this.controlTree;
    }
}


module.exports = ControlBlock;
