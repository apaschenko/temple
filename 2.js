
class Test {
    constructor(aaa) {
        this.bbb = aaa;
    }
}

const test1 = new Test('test1');

console.log('1.1: ', test1.bbb);

const test2 = new Test('test2');

console.log('2: ', test2.bbb);

console.log('1.2: ', test1.bbb);