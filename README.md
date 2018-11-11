# tmdb-ui-cyclejs

A simple, purely functional/reactive TMDb UI using Cycle.js.

#### Installation:
```
git clone https://github.com/sarimarton/tmdb-ui-cyclejs.git
cd tmdb-ui-cyclejs
npm install
```

#### Run:
```
npm start
```

#### Test:
```
npm test
```

#### See it online:

[https://sarimarton.github.io/tmdb-ui-cyclejs/dist/](https://sarimarton.github.io/tmdb-ui-cyclejs/dist/)

### Comments

I chose Cycle.js because it's a purely functional framework. If I were to use React, I would've used [Cycle-React](https://www.npmjs.com/package/cycle-react) or something [similar](https://staltz.com/use-react-in-cyclejs-and-vice-versa.html) to achieve the same purely functional approach.

For CSS, I only used the BEM convention, no preprocessor.

Tests need some research, because currently there's no mock HTTP driver for Cycle.js.
