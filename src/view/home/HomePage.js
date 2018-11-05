import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './HomePage.css'

import { SearchBar } from './SearchBar.js';
import { ResultsContainer } from './ResultsContainer.js';

export function HomePage(sources) {
  const {
    DOM: searchBarVdom$,
    HTTP: searchBarHttp$,
    searchPhrase$,
    searchResponse$,
    searchIsLoading$,
    searchIsError$
  } = SearchBar(sources);

  const discoveryModePredicate =
    phrase => phrase.length === 0;

  const searchResultItemClick$ =
    sources.DOM
      .select('.ResultsContainer__result-item')
      .events('click');

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

  const content$ =
    xs.combine(searchPhrase$, searchResponse$, discoveryResponse$)
      .map(([searchPhrase, searchResponse, discoveryResponse]) =>
        discoveryModePredicate(searchPhrase)
          ? discoveryResponse
          : searchResponse
      )
      .startWith('');

  const movieTitle$ =
    xs.combine(content$, searchResultItemClick$)
      .map(([content, searchResultItemClick]) => {
        const clickedItem = content.results && content.results.find(
          item => item.id == searchResultItemClick.target.dataset.id
        );

        return clickedItem ? clickedItem.title : '';
      })

  const vdom$ =
    xs.combine(searchBarVdom$, searchPhrase$, content$, searchIsLoading$, searchIsError$)
      .map(([searchBarVdom, searchPhrase, content, searchIsLoading, searchIsError]) => {
        return (
          <div className="HomePage">
            <h1>TMDb UI – Home</h1>
            <legend className="uk-legend">Search for a Title:</legend>

            {searchBarVdom}

            <h3 className="uk-heading-bullet uk-margin-remove-top">
              {discoveryModePredicate(searchPhrase)
                ? 'Popular Now'
                : `Search Results for "${searchPhrase}":`}
            </h3>

            {ResultsContainer(searchIsLoading, searchIsError, content.results)}
          </div>
        );
      });

  const http$ = xs.merge(
    searchBarHttp$,
    discoveryRequest$
  );

  const navigation$ =
    searchResultItemClick$
      .map(event => `/movie/${event.target.closest('[data-id]').dataset.id}`);

  return {
    DOM: vdom$,
    HTTP: http$,
    history: navigation$,

    // See the comment in main.js
    movieTitle$
  };
}
