// Core cycle.js libs
import xs from 'xstream';
import { run } from '@cycle/run';

// Side-effect drivers
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { timeDriver } from '@cycle/time';
import { makeHashHistoryDriver } from '@cycle/history';

// JSX
import Snabbdom from 'snabbdom-pragma';

// Router
import { routerify } from 'cyclic-router';
import switchPath from 'switch-path';

// Polyfill
import fromEntries from 'object.fromentries';

// Custom CSS
import css from './main.css';

// Main views
import { HomePage } from './view/home/HomePage.js';
import { MovieDetailsPage } from './view/details/MovieDetailsPage.js';

export function main(sources) {
  const homePageClick$ = sources.DOM
    .select('.home, .view-container[data-active-page="item"] > .view[data-page="home"]')
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
     props$: xs.of({
       movieId$,
       // It is used only to avoid load flickering on the Movie page.
       // movieTitle$ is defined as a sink for the sake of simplicity,
       // and complying with the requirement to not use any state lib.
       movieTitle$: homePageSinks.movieTitle$
     })
  });

  // Combine all the views to allow transition
  const vdom$ =
    xs.combine(homePageSinks.DOM, moviePageSinks.DOM, pageKey$)
      .map(([homePageVdom, moviePageVdom, pageKey]) =>
        <div className="app uk-light uk-background-secondary">
          <div className="header uk-width-1-1">
            <ul className="uk-breadcrumb uk-width-1-1">
              {pageKey !== 'home'
                ? <li className="uk-width-1-1">
                    <a className="home uk-width-1-1 uk-padding-small">
                      <span className="uk-margin-small-right uk-icon" attrs={{ 'uk-icon': 'icon:chevron-left' }}></span>
                      Back
                    </a>
                  </li>
                : <li>&nbsp;</li>
              }
            </ul>
          </div>
          <div className="view-container" data-activePage={pageKey}>
            {[['home', homePageVdom], ['item', moviePageVdom]]
            .map(([name, vdom]) =>
              <div className="view uk-margin-top-small uk-margin-left uk-margin-right" data-page={name}>
                {vdom}
              </div>
            )}
          </div>
        </div>
      )

  const http$ =
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
      vdom$,

    HTTP:
      http$,

    router:
      routerSink$
  };
}

const mainWithRouting =
  routerify(main, switchPath);

const drivers = {
  DOM: makeDOMDriver('#app'),
  history: makeHashHistoryDriver(),
  HTTP: makeHTTPDriver(),
  Time: timeDriver,
  SvcUrl: () => (relativeUrl) =>
    relativeUrl
      .replace(/^/, 'https://api.themoviedb.org/3')
      .replace(/(\?|$)/, '?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&'),
};

run(mainWithRouting, drivers);
