import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './App.css';

import { HomePage } from './home/HomePage.js';
import { MovieDetailsPage } from './details/MovieDetailsPage.js';

export function App(sources) {
  const homePageClick$ = sources.DOM
    .select('.home, .view-container[data-active-page="item"] > .view[data-page="home"]')
    .events('click');

  const routerConfig = {
    'home': /^\/$/,
    'item': /^\/movie\/(\d+)$/
  };

  const routerMatch$ =
    sources.history
      .map(item =>
        Object.entries(routerConfig).reduce(
          (acc, [key, re]) =>
            acc || re.test(item.pathname) && { key, args: [RegExp.$1] },
          false
        )
        || { key: 'home', args: [] }
      )

  const movieId$ =
    routerMatch$
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
    xs.combine(homePageSinks.DOM, moviePageSinks.DOM, routerMatch$)
      .map(([homePageVdom, moviePageVdom, routerMatch]) =>
        <div className="App uk-light uk-background-secondary">
          <div className="App__header uk-width-1-1">
            <ul className="uk-breadcrumb uk-width-1-1">
              <li className="uk-width-1-1" style={'visibility: ' + (routerMatch.key === 'home' ? 'hidden' : 'visible')}>
                <a className="home uk-width-1-1 uk-padding-small">
                  <span className="uk-margin-small-right uk-icon" attrs={{ 'uk-icon': 'icon:chevron-left' }}></span>
                  Back
                </a>
              </li>
            </ul>
          </div>
          <div className="App__view-container" data-activePage={routerMatch.key}>
            {[['home', homePageVdom], ['item', moviePageVdom]]
            .map(([name, vdom]) =>
              <div className="App__view uk-margin-top-small uk-margin-left uk-margin-right" data-page={name}>
                {vdom}
              </div>
            )}
          </div>
        </div>
      )

  const http$ = xs.merge(
    homePageSinks.HTTP,
    moviePageSinks.HTTP
  );

  const navigation$ = xs.merge(
    homePageClick$.mapTo('/'),
    homePageSinks.history
  );

  return {
    DOM: vdom$,
    HTTP: http$,
    history: navigation$,
  };
}
