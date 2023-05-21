# Euterpe

The sole mono-repo for all things Euterpe.

## Understand this workspace

Run `npx nx graph` to see a diagram of the dependencies of the projects.
All programs go like this: `npx nx {package script} {package}`

## Test this workspace

Run `npx nx server player-web-test` to see the music player in a minimal demo.

## Build

Run `npx nx build player` to build the player.

## Publish

First build, then `npm publish --access=public`