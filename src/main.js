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
    name: 'home',
    cmp: () => HomePage
  }, {
    path: '/movie/:id',
    name: 'item',
    cmp: id => sources => MovieDetailsPage({
       ...sources,
       props$: xs.of({ id })
    })
  }];

  const routerDefEntries = viewEntries
    .map(({ path, name, cmp }) => [
      path,
      // switchPath generates different output for parametrized routes, so
      // we equalize here
      /\/:\w+/.test(path)
        ? (...args) => ({ name, args, cmp })
        : { name, args: [], cmp }
    ]);

  const activePage$ = sources.router.define(fromEntries(routerDefEntries))
    .map(match => ({
      name: match.value.name,
      result: match.value.cmp(...match.value.args)(sources)
    }));

  // Execute both subpages to allow rendering all of them for smooth transition
  const pages$ = xs.combine(activePage$, xs.of(viewEntries))
    .map(([activePage, viewEntries]) =>
      viewEntries.map(entry => ({
        name: entry.name,
        isActive: entry.name === activePage.name,
        result: entry.name === activePage.name
          ? activePage.result
          : entry.cmp()(sources)
      }))
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

  // Combine all the views to allow transition
  const combinedVdom$ = pages$.map(pages =>
    xs.combine.apply(null, pages.map(
      page => page.result.DOM.map(vdom =>
        viewTemplate(page.name, vdom, page.isActive)
      )
    ))
    .map(vdoms =>
      mainTemplate(vdoms, pages.find(page => page.isActive).name)
    )
  ).flatten();

  const httpSink$ =
    activePage$
      .map(match => match.result.HTTP)
      .filter(http => http) // fail safety
      .flatten();

  const routerSink$ =
    xs.merge(
      homePageClick$
        .mapTo('/'),
      activePage$
        .map(match => match.result.router)
        .filter(router => router)  // fail safety
        .flatten()
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
