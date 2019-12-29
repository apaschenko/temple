'use strict';

const {expect} = require('chai');
const should = require('chai').should();

const moduleUnderTest = require('../lib/ph_lexical_analyzer');

const Exceptions = {
    ILLEGAL_QUOTE:           1,
    BRACKET_AFTER_DELIMITER: 2,
    NESTED_OP_BRACKET:       3,
    ILLEGAL_CL_BRACKET:      4,
    DOUBLE_DELIMITER:        5,
    UNTERMINATED_STRING:     6
};


describe('ph_lexical_analyzer.js', function () {
    let analyzerInput = {
        placeholder: undefined,
        fullEntry: 'test Full Entry',
        layerName: 'test Layer Name',
    };

    let options = {};
    let actualExc, actualData, throwing;

    const modules = {
        E: {
            Throw: function(exception, data) {
                actualExc = exception;
                actualData = data;
                throwing = true;
            },
            Exceptions
        },
        C: {
            ESC_SYMBOL: '\\'
        }
    };

    describe('Positive tests', function() {
        const fixtures = [
            {
                ph: `aaa`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'}
                ]
            },
            {
                ph: `aaa.bbb[ccc]`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'ccc', type: 'regular', underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa . bbb[ ccc ]`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'ccc', type: 'regular', underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb["ccc"]`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'ccc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: ` aaa.bbb["c'cc"] `,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'c\'cc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: ` aaa.bbb ["c[c]c"] `,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'c[c]c', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: ` aaa.bbb ["c.c,c"] `,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'c.c,c', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb['ccc']`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'ccc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb[\`ccc\`]`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'ccc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb[*, ccc]`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: '*',   type: 'regular', underBrackets: true, delimiter: undefined},
                    {value: 'ccc', type: 'regular', underBrackets: true, delimiter: ','}
                ]
            },
            {
                ph: `aaa.bbb['c\ncc']`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'c\ncc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb['c\u21b9cc']`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'c\u21b9cc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
            {
                ph: `aaa.bbb['c\x23cc']`,
                expect: [
                    {value: 'aaa', type: 'regular', underBrackets: false, delimiter: undefined},
                    {value: 'bbb', type: 'regular', underBrackets: false, delimiter: '.'},
                    {value: 'c#cc', type: 'string',  underBrackets: true, delimiter: undefined}
                ]
            },
        ];

        for (const test of fixtures) {
            it(`|${test.ph}|`, function() {
                analyzerInput.placeholder = test.ph;
                const result = moduleUnderTest(analyzerInput, options, modules);

                Array.isArray(result).should.equal(true);
                result.length.should.equal(test.expect.length);
                for (let i = 0; i < result.length; i++) {
                    expect(result[i].value).to.equal(test.expect[i].value);
                    expect(result[i].type).to.equal(test.expect[i].type);
                    expect(result[i].underBrackets).to.equal(test.expect[i].underBrackets);
                    expect(result[i].delimiter).to.equal(test.expect[i].delimiter);
                }
            });
        }
    });

    describe('Negative tests', function() {
        const fixtures = [
            {ph: 'aaa"bbb"', exc: Exceptions.ILLEGAL_QUOTE},
            {ph: 'aaa..bbb', exc: Exceptions.DOUBLE_DELIMITER},
            {ph: 'aaa,.bbb', exc: Exceptions.DOUBLE_DELIMITER},
            {ph: 'aaa.,bbb', exc: Exceptions.DOUBLE_DELIMITER},
            {ph: 'aaa[bbb, ccc[2] ]', exc: Exceptions.NESTED_OP_BRACKET},
            {ph: 'aaa. "bbb', exc: Exceptions.UNTERMINATED_STRING},
            {ph: 'aaa. bbb].ccc', exc: Exceptions.ILLEGAL_CL_BRACKET},
            {ph: 'aaa. [bbb].ccc', exc: Exceptions.BRACKET_AFTER_DELIMITER}
        ];

        for (const test of fixtures) {
            it(`|${test.ph}|`, function() {
                throwing = false;
                analyzerInput.placeholder = test.ph;
                moduleUnderTest(analyzerInput, options, modules);
                expect(actualExc).to.equal(test.exc);
            });
        }
    });
});
