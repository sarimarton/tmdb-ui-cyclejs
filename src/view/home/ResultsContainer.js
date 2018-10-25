import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

export function ResultsContainer(isLoading, isError, results) {
  return (
    <div className="results-container">
      <div>{isLoading ? 'Loading...' : ''}</div>
      <div>{isError ? 'Network error...' : ''}</div>

      <ul className="uk-thumbnav">
      {typeof results === 'object' && !isLoading && !isError && results.map(result => {

        return (
          result.backdrop_path &&
          <li className="uk-margin-bottom" attrs={{width: 315, height: 169}}>
            <a href="#"
              className="result-item"
              attrs={{onclick: 'return false' }}
              data-id={result.id}
            >

              {/* I should assemble the URL according to
                https://developers.themoviedb.org/3/configuration/get-api-configuration
              */}

              <img src={`http://image.tmdb.org/t/p/w300${result.backdrop_path}`} alt="" />
            </a>
          </li>
        );
      })}
      </ul>
    </div>
  );
}
