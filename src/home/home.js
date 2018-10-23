import xs from 'xstream';
import { run } from '@cycle/run';
import { makeDOMDriver, div, input, p } from '@cycle/dom';
import Snabbdom from 'snabbdom-pragma';
import { routerify } from 'cyclic-router';
import { makeHistoryDriver } from '@cycle/history';
import switchPath from 'switch-path';

export function HomeComponent(sources) {
  return {
    DOM: xs.of(
      <div>
        Home Page
      </div>
    )
  };
}
