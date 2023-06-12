# Euterpe

Fully featured AudioContext music player for the web.

Features:
 - "Local" library/Database for songs, collections etc.
 - Queue
 - History
 - Easy way to create Vector based audio visuals
 - Safe. Provides wrappers for all functions that are either unsafe or don't give a success return. (very Rust inspired, yes.)
 - Async / Await or simple funcions.

## How to use:

#### Simple demo [here](https://github.com/euterpe-js/euterpe-source/tree/master/packages/euterpe-web-test)

Since this package is just a compilation of our smaller modules, you can read individual modules' tutorials on their respective npm page:
 - [Euterpe Player](https://www.npmjs.com/package/@euterpe.js/player)
 - [Euterpe Visualizer](https://www.npmjs.com/package/@euterpe.js/visualizer)
 - [Euterpe Music Library](https://www.npmjs.com/package/@euterpe.js/music-library)

This module builds on those, and further adds functions for playing backwards, forwards and managing the queue.