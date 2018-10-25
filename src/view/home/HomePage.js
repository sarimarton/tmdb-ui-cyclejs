import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './HomePage.css'
import { ResultsContainer } from './ResultsContainer.js';

export function HomePage(sources) {
  const searchResultItemClick$ = sources.DOM
    .select('.result-item')
    .events('click');

  const searchPhrase$ =
    sources.DOM
      .select('.search-phrase-input')
      .events('input')
      .map(ev => ev.target.value)
      .filter(val => val.length > 3)
      .compose(sources.Time.debounce(250))
      .startWith('');

  const searchRequest$ =
    searchPhrase$
      .filter(val => val)
      .map(searchPhrase => ({
        url: `https://api.themoviedb.org/3/search/movie?api_key=${sources.apiKey}&query=${searchPhrase}`,
        category: 'search',
        isRequest: true // duck typing :(
      }));

  const searchResponse$ =
    sources.HTTP
      .select('search')
      .map(resp$ =>
        resp$.replaceError(err => xs.of(err))
      )
      .flatten()
      .map(resp =>
        resp instanceof Error
          ? resp
          : JSON.parse(resp.text)
      );

  const content$ =
    searchResponse$
      .startWith('');

  const isLoading$ =
    xs.merge(searchRequest$, searchResponse$)
      .map(r => r && r.isRequest)
      .startWith(false);

  const isError$ =
    xs.merge(searchRequest$, searchResponse$)
      .map(r => r instanceof Error)
      .startWith(false);

  const vdom$ =
    xs.combine(searchPhrase$, content$, isLoading$, isError$)
      .map(([searchPhrase, content, isLoading, isError]) => {
        return (
          <div>
            <h1>TMDb UI – Home</h1>
            <legend className="uk-legend">Search for a Title:</legend>
            <input className={'search-phrase-input uk-input uk-margin-bottom'} />

            {ResultsContainer(isLoading, isError, content && content.results)}
          </div>
        );
      });


  return {
    DOM:
      vdom$,

    HTTP: searchRequest$,

    router:
      searchResultItemClick$
        .map(event => `/movie/${event.target.dataset.id}`)
  };
}
