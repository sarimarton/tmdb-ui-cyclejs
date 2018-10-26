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
      .compose(sources.Time.debounce(300))
      .startWith('');

  const discoveryRequest$ =
    xs.of({
      url: sources.SvcUrl(`/movie/popular?language=en-US&page=1`),
      category: 'discovery',
      isRequest: true // duck typing :(
    })

  const discoveryResponse$ =
    sources.HTTP
      .select('discovery')
      .map(resp$ =>
        resp$.replaceError(err => xs.of(err))
      )
      .flatten()
      .map(resp => resp instanceof Error ? resp : JSON.parse(resp.text))
      .startWith('')

  const searchRequest$ =
    searchPhrase$
      .filter(val => val.length > 3)
      .map(searchPhrase => ({
        url: sources.SvcUrl(`/search/movie?query=${searchPhrase}`),
        category: 'search',
        isRequest: true // duck typing :(
      }))

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
      )
      .startWith('')

  const content$ =
    xs.combine(searchPhrase$, searchResponse$, discoveryResponse$)
      .map(([searchPhrase, searchResponse, discoveryResponse]) =>
        searchPhrase.length > 3
          ? searchResponse
          : discoveryResponse
      )
      .startWith('');

  const movieTitle$ =
    xs.combine(content$, searchResultItemClick$)
      .map(([content, searchResultItemClick]) =>
        content.results.find(
          item => item.id == searchResultItemClick.target.dataset.id
        ).title
      )

  const isLoading$ =
    xs.merge(searchRequest$, searchResponse$)
      .map(r => r && r.isRequest)
      .startWith(false);

  const isError$ =
    xs.merge(searchRequest$, searchResponse$)
      .map(r => r instanceof Error)
      .startWith(false);

  const vdom$ =
    xs.combine(content$, isLoading$, isError$)
      .map(([content, isLoading, isError]) => {
        return (
          <div>
            <h1>TMDb UI – Home</h1>
            <legend className="uk-legend">Search for a Title:</legend>
            <input className={'search-phrase-input uk-input uk-margin-bottom'} />

            {ResultsContainer(isLoading, isError, content.results)}
          </div>
        );
      });


  return {
    DOM:
      vdom$,

    HTTP:
      xs.merge(searchRequest$, discoveryRequest$),

    router:
      searchResultItemClick$
        .map(event => `/movie/${event.target.closest('[data-id]').dataset.id}`),

    // See the comment in main.js
    movieTitle$
  };
}
