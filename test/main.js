'use strict';

const {expect} = require('chai');
const should = require('chai').should();
const sinon = require('sinon');

const moduleUnderTest = require('../lib/main');
const E = require('../lib/exceptions');

describe('main.js', function () {
    let result;
    const testModules = {
        E: {
            Throw: function(exception, data) { return result = {exception, data} },
            Exceptions: E.Exceptions
        },
        CONST: {
            ENTRY_POINT_NAME: 'start'
        }
    };

    let params;

    const Exceptions = {
    };

    describe('InputValidator', function() {

        let validator = moduleUnderTest.InputValidator;

        describe('keys format', function () {
            before(function () {
                params = {
                    data: undefined,
                    options: {},
                    getters: undefined
                };
            });

        });
    });

});
