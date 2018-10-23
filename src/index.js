import xs from 'xstream';
import { run } from '@cycle/run';
import { makeDOMDriver, div, input, p } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { timeDriver } from '@cycle/time';
import Snabbdom from 'snabbdom-pragma';
import { routerify } from 'cyclic-router';
import { makeHistoryDriver } from '@cycle/history';
import switchPath from 'switch-path';

import css from './index.css';

import { HomeComponent } from './view/home/Home.js';
import { ItemComponent } from './view/item/Item.js';

function main(sources) {
  const homePageClick$ = sources.DOM.select('.home').events('click');

  const views = {
    '/': HomeComponent,
    '/item': ItemComponent
  };

  const match$ = sources.router.define(views);

  const page$ = match$.map(
    ({ path, value: page }) =>
      page({
        ...sources,
        router: sources.router.path(path)
      })
  );

  const headerVDom =
    <div>
      header
    </div>;

  return {
    DOM:
      page$
        .map(page =>
          page.DOM.map(pageVDom =>
            <div>
              {headerVDom}
              {pageVDom}
            </div>
          )
        ).flatten(),

    HTTP:
      page$
        .map(page => page.HTTP)
        .filter(http => http)
        .flatten(),

    router:
      xs.merge(
        homePageClick$.mapTo('/')
      )
  };
}

const mainWithRouting = routerify(main, switchPath);
const drivers = {
  DOM: makeDOMDriver('#app'),
  history: makeHistoryDriver(),
  HTTP: makeHTTPDriver(),
  Time: timeDriver,
  apiKey: () => 'bf6b860ab05ac2d94054ba9ca96cf1fa'
};

run(mainWithRouting, drivers);
