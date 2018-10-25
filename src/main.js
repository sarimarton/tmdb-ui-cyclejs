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
import { HomePage } from './view/home/HomePage.js';
import { MovieDetailsPage } from './view/details/MovieDetailsPage.js';

function main(sources) {
  const homePageClick$ = sources.DOM
    .select('.home')
    .events('click');

  const viewEntries = [{
    path: '/',
    key: 'home'
  }, {
    path: '/movie/:id',
    key: 'item'
  }];

  const routerDefEntries = viewEntries
    .map(({ path, key }) => [
      path,
      // switchPath generates different outputs for parametrized routes, so
      // we equalize here - a bit hacky
      /\/:\w+/.test(path)
        ? (...args) => ({ key, args })
        : { key, args: [] }
    ]);

  const routerMatch$ =
    sources.router.define(fromEntries(routerDefEntries));

  const pageKey$ = routerMatch$
    .map(match => match.value.key);

  const movieId$ = routerMatch$
    .map(activePage => activePage.value.args[0])
    .filter(id => id);

  const homePageSinks = HomePage(sources);
  const moviePageSinks = MovieDetailsPage({
     ...sources,
     props$: xs.of({ movieId$ })
  });

  const mainTemplate = (viewsVDoms, activePageName) =>
    <div className="app uk-light uk-background-secondary">
      <div className="header">
        <ul className="uk-breadcrumb uk-padding-small">
          {activePageName !== 'home'
            ? <li><a className="home">Back</a></li>
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

  // Combine all the views to allow transition
  const combinedVdom$ =
    xs.combine(homePageSinks.DOM, moviePageSinks.DOM, pageKey$)
      .map(([homePageVdom, moviePageVdom, pageKey]) =>
        mainTemplate(
          [
            viewTemplate('home', homePageVdom, pageKey === 'home'),
            viewTemplate('item', moviePageVdom, pageKey === 'item')
          ],
          pageKey
        )
      )

  const httpSink$ =
    xs.merge(
      homePageSinks.HTTP,
      moviePageSinks.HTTP
    );

  const routerSink$ =
    xs.merge(
      homePageClick$
        .mapTo('/'),
      homePageSinks.router
    );

  return {
    DOM:
      combinedVdom$,

    HTTP:
      httpSink$,

    router:
      routerSink$
  };
}

const mainWithRouting =
  routerify(main, switchPath);

const drivers = {
  DOM: makeDOMDriver('#app'),
  history: makeHistoryDriver(),
  HTTP: makeHTTPDriver(),
  Time: timeDriver,
  apiKey: () => 'bf6b860ab05ac2d94054ba9ca96cf1fa'
};

run(mainWithRouting, drivers);
