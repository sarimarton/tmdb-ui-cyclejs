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

#### See it online (history API doesn't work due to relative path):

[https://sarimarton.github.io/tmdb-ui-cyclejs/dist/](https://sarimarton.github.io/tmdb-ui-cyclejs/dist/)

### Comments

I chose Cycle.js because it's a purely functional framework. Now the requirement said that I must not use a framework, but I dared to still use it, because, in my opinion, Cycle.js is arguably not more of a framework, than React; even though they call themselves so. It doesn't define how I organize my files, neither has god objects or any such mechanism. It's more like a set of interchangeable libraries. If I were to use React, I would've used [Cycle-React](https://www.npmjs.com/package/cycle-react) or something similar to achieve the same purely functional approach. I hope this doesn't disqualifies me in the process.

Also tests need some research, because currently there's no mock HTTP driver for Cycle.js.

I was a little rushed with the commit message history, didn't rebase diligently.
