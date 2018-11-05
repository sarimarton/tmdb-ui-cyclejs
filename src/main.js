import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { timeDriver } from '@cycle/time';
import { makeHashHistoryDriver } from '@cycle/history';

import { App } from './view/App.js';

const drivers = {
  DOM: makeDOMDriver('#root'),
  HTTP: makeHTTPDriver(),
  history: makeHashHistoryDriver(),
  Time: timeDriver,
  SvcUrl: () => (relativeUrl) =>
    relativeUrl
      .replace(/^/, 'https://api.themoviedb.org/3')
      .replace(/(\?|$)/, '?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&'),
};

run(App, drivers);
