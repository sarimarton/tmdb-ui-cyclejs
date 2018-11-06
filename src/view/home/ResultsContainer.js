import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './ResultsContainer.css';

export function ResultsContainer(sources) {
  const resultsItemClick$ =
    sources.DOM
      .select('.js-result-click')
      .events('click');

  const {
    isLoading$,
    isError$,
    content$
  } = sources;

  const vdom$ =
    xs.combine(isLoading$, isError$, content$)
      .map(([isLoading, isError, content]) =>
        content && content.results &&
        <div className="ResultsContainer">
          <div>{isLoading ? 'Loading...' : ''}</div>
          <div>{isError ? 'Network error' : ''}</div>

          <ul className="uk-thumbnav">
          {!isLoading && !isError && content
            .results.filter(result => result.backdrop_path)
            .map(result =>
              <li className="uk-margin-bottom">
                <a className="ResultsContainer__result-item js-result-click" href="#"
                  attrs={{ onclick: 'return false' }} data-id={result.id}>

                  {/* I should assemble the URL according to
                    https://developers.themoviedb.org/3/configuration/get-api-configuration
                  */}
                  <div className="ResultsContainer__thumbnail-holder">
                    <img src={`http://image.tmdb.org/t/p/w300${result.backdrop_path}`} alt="" />
                  </div>
                  <div className="ResultsContainer__caption uk-text-small uk-text-muted">{result.title}</div>
                </a>
              </li>
            )
          }
          </ul>
        </div>
      )

  return {
    DOM: vdom$,

    resultsItemClick$
  };
}
