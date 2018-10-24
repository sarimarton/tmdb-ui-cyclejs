import xs from 'xstream';
import Snabbdom from 'snabbdom-pragma';

export function ItemComponent(sources) {
  return {
    DOM: xs.of(
      <div>
        <h1>Item</h1>
        <br />
        Item
      </div>
    )
  };
}
