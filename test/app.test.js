var assert = chai.assert;
var should = chai.should();

describe('Hello Greeter for myapp', function() {
    describe('test greet method', function() {
        var greeter = new Greeter();
        it("should be return hello world",function(){
            console.log('hello');
            assert.equal("Hello World!", greeter.greet("World"));
        });
    });

    describe('test greet method with value null', function(){
        var greeter = new Greeter();
        it("should not null",function(){
            console.log('not null');
            assert.isNotNull(greeter);
        });
    });
});

describe('Array', function() {
    before(function() {
        console.log('before hook called in before all test');
    });
    beforeEach(function() {
        console.log('beforeEach hook invoke before each method');
    });

    afterEach(function() {
        console.log('afterEach hook invoke after each method');
    });
    after(function() {
        console.log('after hook called in after all test');
    });

    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function(){
            console.log('invoke one assert');
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));

        });
    });

    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function(){
            console.log('invoke second should');
            [1,2,3].indexOf(5).should.equal(-1);
            [1,2,3].indexOf(0).should.equal(-1);
        });
    });
});
