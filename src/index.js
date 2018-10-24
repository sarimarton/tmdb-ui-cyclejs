import xs from 'xstream';
import { run } from '@cycle/run';
import { makeDOMDriver, div, input, p } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { timeDriver } from '@cycle/time';
import Snabbdom from 'snabbdom-pragma';
import { routerify } from 'cyclic-router';
import { makeHistoryDriver } from '@cycle/history';
import switchPath from 'switch-path';

import fromEntries from 'object.fromentries';

import UIkit from 'uikit';
import UIkitCss from '../node_modules/uikit/dist/css/uikit.min.css';

import css from './index.css';

import { HomeComponent } from './view/home/Home.js';
import { ItemComponent } from './view/item/Item.js';

function main(sources) {
  const homePageClick$ = sources.DOM
    .select('.home')
    .events('click');

  const searchResultItemClick$ = sources.DOM
    .select('.result-item')
    .events('click');

  const viewTriplets = [
    ['/', 'home', HomeComponent],
    ['/item', 'item', ItemComponent]
  ];

  const routeDefinition = fromEntries(
    viewTriplets.map(([path, name, cmp]) => [path, cmp])
  );

  const match$ = sources.router.define(routeDefinition);

  const activePage$ = match$.map(
    ({ path, value: page }) =>
      page({
        ...sources,
        router: sources.router.path(path)
      })
  );

  const mainTemplate = (viewsVDoms, activePageName) =>
      <div className="app uk-light uk-background-secondary uk-padding">
        <div className="header">
          {activePageName !== 'home'
            ? <a className="home">Go To Home</a>
            : ''
          }
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <a href="#" className="result-item" attrs={{onclick: 'return false' }}>Item</a>

        </div>
        <div className="view-container" data-activePage={activePageName}>
          {viewsVDoms.map(vdom => vdom)}
        </div>
      </div>

  const viewTemplate = (name, vdom, isActive) =>
    <div className="view uk-padding" data-page={name} data-active={isActive}>
      {vdom}
    </div>;

  const views$ =
    match$.map(({ value: page }) =>
      // combine all the views
      xs.combine.apply(null,
        viewTriplets.map(([, name, cmp]) =>
          cmp(sources).DOM.map(vdom =>
            viewTemplate(name, vdom, cmp === page)
          )
        )
      )
      // and wrap them in the main template
      .map(vdoms =>
        mainTemplate(
          vdoms,
          viewTriplets.find(([,, cmp]) => cmp === page)[1]
        )
      )
    )
    .flatten();

  return {
    DOM:
      views$,

    HTTP:
      activePage$
        .map(page => page.HTTP)
        .filter(http => http) // some pages don't have http output
        .flatten(),

    router:
      xs.merge(
        homePageClick$.mapTo('/'),
        searchResultItemClick$.mapTo('/item')
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
