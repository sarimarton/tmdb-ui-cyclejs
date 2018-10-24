// Core cycle.js libs
import xs from 'xstream';
import { run } from '@cycle/run';

// Side-effect drivers
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { timeDriver } from '@cycle/time';
import { makeHistoryDriver } from '@cycle/history';

// JSX
import Snabbdom from 'snabbdom-pragma';

// Router
import { routerify } from 'cyclic-router';
import switchPath from 'switch-path';

// Polyfill
import fromEntries from 'object.fromentries';

// CSS
import UIkit from 'uikit';
import UIkitCss from '../node_modules/uikit/dist/css/uikit.min.css';

// Custom CSS
import css from './main.css';

// Main views
import { HomeComponent } from './view/home/Home.js';
import { MovieDetailsPage } from './view/details/MovieDetailsPage.js';

function main(sources) {
  const homePageClick$ = sources.DOM
    .select('.home')
    .events('click');

  const searchResultItemClick$ = sources.DOM
    .select('.result-item')
    .events('click');

  const viewEntries = [
    ['/', {
      name: 'home',
      cmp: HomeComponent
    }],
    ['/item/:id', id => ({
      name: 'item',
      cmp: sources => MovieDetailsPage({
         ...sources,
         props$: xs.of({ id })
      })
    })]
  ];

  const match$ =
    sources.router.define(fromEntries(viewEntries));

  const activePage$ = match$.map(
    ({ path, value: pageCfg }) => {
      return pageCfg.cmp({
        ...sources,
        router: sources.router.path(path)
      })
    }
  );

  const mainTemplate = (viewsVDoms, activePageName) =>
    <div className="app uk-light uk-background-secondary">
      <div className="header">
        <ul className="uk-breadcrumb uk-padding-small">
          {activePageName !== 'home'
            ? <li><a className="home">Home</a></li>
            : <li>&nbsp;</li>
          }
        </ul>
      </div>
      <div className="view-container" data-activePage={activePageName}>
        {viewsVDoms.map(vdom => vdom)}
      </div>
    </div>;

  const viewTemplate = (name, vdom, isActive) =>
    <div className="view uk-margin-top-small uk-margin-left uk-margin-right"
      data-page={name} data-active={isActive}
    >
      {vdom}
    </div>;

  const views$ =
    match$.map(({ path, value: pageCfg }) => {
      // It's a bit hacky...
      const _MovieDetailsPage = pageCfg.name === 'item'
        ? pageCfg.cmp
        : MovieDetailsPage;

      // Combine all the views to allow smooth transition
      return xs.combine(
        HomeComponent(sources).DOM.map(vdom =>
          viewTemplate('home', vdom, pageCfg.name === 'home')
        ),
        _MovieDetailsPage(sources).DOM.map(vdom =>
          viewTemplate('item', vdom, pageCfg.name === 'item')
        )
      )

      // Wrap the views in the main template
      .map(vdoms => {
        return mainTemplate(vdoms, pageCfg.name)
      })
    })
    .flatten();

  return {
    DOM:
      views$,

    HTTP:
      activePage$
        .map(page => page.HTTP)
        .filter(http => http) // filter undefined: some pages don't have http sink
        .flatten(),

    router:
      xs.merge(
        homePageClick$
          .mapTo('/'),
        searchResultItemClick$
          .map(event => `/item/${event.target.dataset.id}`)
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
