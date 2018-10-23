import xs from 'xstream';
import { run } from '@cycle/run';
import { div } from '@cycle/dom';
import Snabbdom from 'snabbdom-pragma';

export function HomeComponent(sources) {
  return {
    DOM: xs.of(
      <div className={'page-home'}>
        Home Page
      </div>
    )
  };
}
