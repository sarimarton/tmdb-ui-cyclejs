import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './HomePage.css'

import { SearchBar } from './SearchBar.js';
import { ResultsContainer } from './ResultsContainer.js';

export function HomePage(sources) {
  const searchBarSinks =
    SearchBar(sources);

  const searchPhrase$ =
    searchBarSinks.searchPhrase$;

  const searchResponse$ =
    searchBarSinks.searchResponse$;

  const discoveryModePredicate =
    phrase => phrase.length === 0;

  const searchResultItemClick$ =
    sources.DOM
      .select('.result-item')
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

  const isLoading$ =
    searchBarSinks.searchIsLoading$;

  const isError$ =
    searchBarSinks.searchIsError$;

  const vdom$ =
    xs.combine(searchBarSinks.DOM, searchPhrase$, content$, isLoading$, isError$)
      .map(([searchBarVdom, searchPhrase, content, isLoading, isError]) => {
        return (
          <div>
            <h1>TMDb UI – Home</h1>
            <legend className="uk-legend">Search for a Title:</legend>

            {searchBarVdom}

            <h3 className="uk-heading-bullet uk-margin-remove-top">
              {discoveryModePredicate(searchPhrase)
                ? 'Popular Now'
                : `Search Results for "${searchPhrase}":`}
            </h3>

            {ResultsContainer(isLoading, isError, content.results)}
          </div>
        );
      });


  return {
    DOM:
      vdom$,

    HTTP:
      xs.merge(
        searchBarSinks.HTTP,
        discoveryRequest$
      ),

    router:
      searchResultItemClick$
        .map(event => `/movie/${event.target.closest('[data-id]').dataset.id}`),

    // See the comment in main.js
    movieTitle$
  };
}
