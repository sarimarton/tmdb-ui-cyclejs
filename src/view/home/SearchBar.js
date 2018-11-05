import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

export function SearchBar(sources) {
  const clearSearchClick$ =
    sources.DOM
      .select('.SearchBar .uk-icon[uk-icon="icon:close"]')
      .events('click')

  const searchPhraseInput$ =
    sources.DOM
      .select('.SearchBar__input')
      .events('input')
      .compose(sources.Time.debounce(300))

  const searchPhrase$ =
    xs.merge(searchPhraseInput$, clearSearchClick$)
      .map(ev =>
        ev instanceof InputEvent
          ? ev.target.value
          : ''
      )
      .startWith('');

  const searchRequest$ =
    searchPhrase$
      .filter(searchPhrase => searchPhrase.length > 0)
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

  const isLoading$ =
    xs.merge(searchRequest$, searchResponse$)
      .map(r => r && r.isRequest)
      .startWith(false);

  const isError$ =
    xs.merge(searchRequest$, searchResponse$)
      .map(r => r instanceof Error)
      .startWith(false);

  const vdom$ =
    searchPhrase$
      .map(searchPhrase =>
        <div className="SearchBar uk-inline uk-margin-bottom">
          <a
            className="uk-form-icon uk-form-icon-flip"
            attrs={{ 'uk-icon': 'icon:' + (searchPhrase ? 'close' : 'search') }}
          ></a>
          <input className="SearchBar__input uk-input" type="text" value={searchPhrase} />
        </div>
      );


  return {
    DOM: vdom$,
    HTTP: searchRequest$,

    searchPhrase$,
    searchResponse$,
    isLoading$,
    isError$
  };
}
