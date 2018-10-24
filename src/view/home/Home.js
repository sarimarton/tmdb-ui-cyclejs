import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import { ResultsContainer } from './ResultsContainer.js';

export function HomeComponent(sources) {
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

  return {
    DOM:
      xs.combine(searchPhrase$, content$, isLoading$, isError$)
        .map(([searchPhrase, content, isLoading, isError]) => {
          return (
            <div>
              <h1>TMDb UI – Home</h1>
              <legend className="uk-legend">Search for a Title:</legend>
              <input className={'search-phrase-input uk-input'} />

              {ResultsContainer(isLoading, isError, content && content.results)}
            </div>
          );
        }),

    HTTP: searchRequest$
  };
}
