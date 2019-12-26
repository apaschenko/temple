'use strict';

const {expect} = require('chai');
const should = require('chai').should();

const moduleUnderTest = require('../lib/exceptions');

describe('exception.js', function () {

    describe('Exceptions', function() {
        let Exceptions = moduleUnderTest.Exceptions;

        it('Check is Exceptions an Object', function() {
            expect(Exceptions).to.be.an('object');
        });

        describe('Check format of each Exception', function() {
            let keys = Object.keys(Exceptions);
            for (let exc of keys) {
                let e = Exceptions[exc];
                it(exc, function() {
                    expect(e.name).to.be.a('string');
                    expect(e.message).to.be.a('string');
                    expect(e.code).to.be.a('number');
                });
            }
        });
    });

    describe('Throw', function() {
        let Throw, Exceptions;

        before(function() {
            Throw = moduleUnderTest.Throw;
        });

        it('Call with data parameter', function() {
            let throwing = false;
            const testName = 'test name';
            const testMessage = 'test message';
            const testCode = 'test code';
            const testData = 'test data';
            const testException = {
                name: testName,
                message: testMessage,
                code: testCode
            };

            try {
                Throw(testException, testData);
            } catch (e) {
                expect(e.name).to.equal(testName);
                expect(e.message).to.equal(`${testMessage} ${testData}`);
                expect(e.code).to.equal(testCode);
                throwing = true;
            }

            expect(throwing).to.equal(true);
        });
        it('Call without data parameter', function() {
            let throwing = false;
            const testName = 'test name';
            const testMessage = 'test message';
            const testCode = 'test code';
            const testException = {
                name: testName,
                message: testMessage,
                code: testCode
            };

            try {
                Throw(testException);
            } catch (e) {
                expect(e.name).to.equal(testName);
                expect(e.message).to.equal(`${testMessage} `);
                expect(e.code).to.equal(testCode);
                throwing = true;
            }

            expect(throwing).to.equal(true);
        });

     });
});
