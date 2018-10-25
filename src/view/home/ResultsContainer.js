import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './ResultsContainer.css';

export function ResultsContainer(isLoading, isError, results) {
  return (
    <div className="results-container">
      <div>{isLoading ? 'Loading...' : ''}</div>
      <div>{isError ? 'Network error' : ''}</div>

      <ul className="uk-thumbnav">
      {typeof results === 'object' && !isLoading && !isError && results.map(result => {

        return (
          result.backdrop_path &&
          <li className="uk-margin-bottom">
            <a className="result-item" href="#" attrs={{onclick: 'return false' }} data-id={result.id}>

              {/* I should assemble the URL according to
                https://developers.themoviedb.org/3/configuration/get-api-configuration
              */}
              <div className="result-item-thumbnail-holder">
                <img src={`http://image.tmdb.org/t/p/w300${result.backdrop_path}`} alt="" />
              </div>
              <div className="result-item-caption uk-text-small uk-text-muted">{result.title}</div>
            </a>
          </li>
        );
      })}
      </ul>
    </div>
  );
}
