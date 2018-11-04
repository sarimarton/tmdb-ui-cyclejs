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

// Custom CSS
import css from './main.css';

// Main views
import { HomePage } from './view/home/HomePage.js';
import { MovieDetailsPage } from './view/details/MovieDetailsPage.js';

export function main(sources) {
  const homePageClick$ = sources.DOM
    .select('.home, .view-container[data-active-page="item"] > .view[data-page="home"]')
    .events('click');

  const routerConfig = {
    'home': [/^\/$/, () => []],
    'item': [/^\/movie\/(\d+)$/, () => [RegExp.$1]]
  };

  const routerMatch$ =
    sources.history
      .map(item =>
        Object.entries(routerConfig).reduce(
          (acc, [key, [re, argsFn]]) =>
            acc || re.test(item.pathname) && { key, args: argsFn() },
          false
        )
        || { key: 'home', args: [] }
      )

  const pageKey$ = routerMatch$
    .map(routerMatch => routerMatch.key);

  const movieId$ = routerMatch$
    .map(routerMatch => routerMatch.args[0])
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
              <li className="uk-width-1-1" style={'visibility: ' + (pageKey === 'home' ? 'hidden' : 'visible')}>
                <a className="home uk-width-1-1 uk-padding-small">
                  <span className="uk-margin-small-right uk-icon" attrs={{ 'uk-icon': 'icon:chevron-left' }}></span>
                  Back
                </a>
              </li>
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

  const history$ =
    xs.merge(
      homePageClick$.mapTo('/'),
      homePageSinks.history
    );

  return {
    DOM:
      vdom$,

    HTTP:
      http$,

    history:
      history$
  };
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  history: makeHashHistoryDriver(),
  Time: timeDriver,
  SvcUrl: () => (relativeUrl) =>
    relativeUrl
      .replace(/^/, 'https://api.themoviedb.org/3')
      .replace(/(\?|$)/, '?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&'),
};

run(main, drivers);
