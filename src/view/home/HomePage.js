import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './HomePage.css'
import { ResultsContainer } from './ResultsContainer.js';

export function HomePage(sources) {
  const searchResultItemClick$ =
    sources.DOM
      .select('.result-item')
      .events('click');

  const clearSearchClick$ =
    sources.DOM
      .select('.search-phrase .uk-icon[uk-icon="icon:close"]')
      .events('click')

  const searchPhraseInput$ =
    sources.DOM
      .select('.search-phrase-input')
      .events('input')

  const searchPhrase$ =
    xs.merge(searchPhraseInput$, clearSearchClick$)
      .map(ev =>
        ev instanceof InputEvent
          ? ev.target.value
          : ''
      )
      .compose(sources.Time.debounce(300))
      .startWith('');

  const discoveryModePredicate =
    phrase => phrase.length === 0;

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
      .filter(searchPhrase => !discoveryModePredicate(searchPhrase))
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

            <div className="search-phrase uk-inline uk-margin-bottom">
              <a
                className="uk-form-icon uk-form-icon-flip"
                attrs={{ 'uk-icon': 'icon:' + (searchPhrase ? 'close' : 'search') }}
              ></a>
              <input className={'search-phrase-input uk-input'} type="text" value={searchPhrase} />
            </div>

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
      xs.merge(searchRequest$, discoveryRequest$),

    router:
      searchResultItemClick$
        .map(event => `/movie/${event.target.closest('[data-id]').dataset.id}`),

    // See the comment in main.js
    movieTitle$
  };
}
