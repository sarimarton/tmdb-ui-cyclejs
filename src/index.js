import xs from 'xstream';
import { run } from '@cycle/run';
import { makeDOMDriver, div, input, p } from '@cycle/dom';
import Snabbdom from 'snabbdom-pragma';
import { routerify } from 'cyclic-router';
import { makeHistoryDriver } from '@cycle/history';
import switchPath from 'switch-path';

import { HomeComponent } from './home/home.js';
import { ItemComponent } from './item/item.js';
import css from './index.css';

function main(sources) {
  const homePageClick$ = sources.DOM.select('.home').events('click');

  const match$ = sources.router.define({
    '/': HomeComponent,
    '/item': ItemComponent
  });

  const page$ = match$.map(
    ({ path, value: page }) =>
      page({
        ...sources,
        router: sources.router.path(path)
      })
  );

  return {
    DOM: page$.map(c => c.DOM).flatten(),
    router: xs.merge(
      homePageClick$.mapTo('/')
    )
  };
}

const mainWithRouting = routerify(main, switchPath);
const drivers = {
  DOM: makeDOMDriver('#app'),
  history: makeHistoryDriver()
};

run(mainWithRouting, drivers);
