/**
 * Lib "all-templates"
 * ControlBlock: a class for the grouping of ControlNode by levels.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


class ControlBlock {
    constructor(parentNode, controlTree, name) {
        this.nodes = [];
        this.parent = parentNode;
        this.controlTree = controlTree;
        this.name = `block #${name}`;
    }

    getParent() {
        return this.parent;
    }

    getNodes() {
        return this.nodes;
    }

    addNode(controlNode) {
        this.nodes.push(controlNode);
        controlNode.setBlock(this);
    }

    getControlTree() {
        return this.controlTree;
    }

    getName() {
        return this.name;
    }
}


module.exports = ControlBlock;
