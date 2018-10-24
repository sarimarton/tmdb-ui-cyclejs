import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

import css from './MovieDetailsPage.css';

export function MovieDetailsPage(sources) {

  const detailsRequest$ =
    (sources.props$ || xs.of(false))
      .map(props => {
        return props && ({
          url: `https://api.themoviedb.org/3/movie/${props.id}?api_key=${sources.apiKey}`,
          category: 'details',
          isRequest: true // duck typing :(
        })
      });

  const detailsResponse$ =
    sources.HTTP
      .select('details')
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
    detailsResponse$
      .startWith('');

  const isLoading$ =
    xs.merge(detailsRequest$, detailsResponse$)
      .map(r => r && r.isRequest)
      .startWith(false);

  const isError$ =
    xs.merge(detailsRequest$, detailsResponse$)
      .map(r => r instanceof Error)
      .startWith(false);

  const MovieDetails = content =>
    <div className="movie-details">
      <div className="movie-details-img-container uk-margin-right" style="float: left">
        <img src={`http://image.tmdb.org/t/p/w342${content.poster_path}`} alt="" />
      </div>
      <dl className="uk-description-list">
        <dt>Overview</dt>
        <dd>{content.overview}</dd>
        <dt>Popularity</dt>
        <dd>{content.vote_average}</dd>
        <dt>Release Date</dt>
        <dd>{content.release_date}</dd>
      </dl>
    </div>;

  return {
    DOM:
      xs.combine(content$, isLoading$, isError$)
        .map(([content, isLoading, isError]) => {
          console.log(content);
          return (
            <div>
              <h1>{content.title}</h1>
              <div>{isLoading ? 'Loading...' : ''}</div>
              <div>{isError ? 'Network error...' : ''}</div>
              { content && MovieDetails(content) }
            </div>
          );
        }),

    HTTP:
      detailsRequest$
  };
}