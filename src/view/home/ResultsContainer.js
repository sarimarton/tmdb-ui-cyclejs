import xs from 'xstream';
import { run } from '@cycle/run';
import { div, h1 } from '@cycle/dom';
import Snabbdom from 'snabbdom-pragma';

export function ResultsContainer(isLoading, isError, results) {
  return (
    <div className="results-container">
      <div>{isLoading ? 'Loading...' : ''}</div>
      <div>{isError ? 'Network error...' : ''}</div>

      <ul className="uk-thumbnav">
      {typeof results == 'object' && !isLoading && !isError && results.map(result =>
        <li>
          <a href="#" className="result-item" attrs={{onclick: 'return false' }}>
            <img src={`http://image.tmdb.org/t/p/w300${result.backdrop_path}`} alt="" />
          </a>
        </li>
      )}
      </ul>
    </div>
  );
}
