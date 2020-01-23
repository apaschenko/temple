/**
 * Lib "all-templates"
 * Lexeme: a class for the representing of lexical analyze results (a single lexeme).
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const { LEXEME_TYPE } = require('../constants/internal_definitions');


class Lexeme {
    constructor() {
        this.value = '';
        this.type  = LEXEME_TYPE.REGULAR;
        return this;
    }

    getValue() {
        return this.value;
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

    setName(name) {
        this.name = `lexeme #${name}`;
        return this;
    }

    getName() {
        return this.name;
    }
}


module.exports = Lexeme;
