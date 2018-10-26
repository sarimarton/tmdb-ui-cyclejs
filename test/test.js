import {mockDOMSource} from '@cycle/dom';
import {select} from 'snabbdom-selector'
import {mockTimeSource} from '@cycle/time';
import {main} from '../src/main';


var assert = require('assert');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});


// describe('main', () => {
//   it('increments and decrements in response to clicks', (done) => {
//     const Time = mockTimeSource();
//
//     const addClick$      = Time.diagram(`---x--x-------x--x--|`);
//     const subtractClick$ = Time.diagram(`---------x----------|`);
//     const expectedCount$ = Time.diagram(`0--1--2--1----2--3--|`);
//
//     const DOM = mockDOMSource({
//       '.add': {
//         click: addClick$
//       },
//
//       '.subtract': {
//         click: subtractClick$
//       },
//     });
//
//     const counter = Counter({DOM});
//
//     const count$ = counter.DOM.map(vtree => select('.count', vtree)[0].text);
//
//     Time.assertEqual(count$, expectedCount$)
//
//     Time.run(done);
//   });
// });
