# stream-tag

> A tagged template literal utility for Node streams

Works in node.js and the browser, if streams are polyfilled.

This utility is a small tagged-template-literal function that enables
interpolation of strings, numbers, Buffers, promises, and streams
into a new stream.

This is highly useful when constructing stream templates that will be
emitted by a server-side rendering service for instance. One example
of such use-case is React's streamed SSR, where it's useful to combine
its stream with other variables into an HTML output template.

## Installation

```sh
yarn add stream-tag
# or
npm install stream-tag
```

## Usage

```js
const streamTag = require('stream-tag');

const stream = streamTag`
  one
  ${'two'}
  ${3}
  ${Promise.resolve('four')}
  ${Promise.resolve(5)}
  ${Buffer.from('six')}
  ${streamTag`seven`}
`;

// This is what stream emits
const output = `
  one
  two
  3
  four
  5
  six
  seven
`;
```

## API

### streamTag(templateStringArr, ...interpolations)

Can be called as a tagged template literal. Returns a stream emitting the template
with all interpolations combined into the output.

#### templateStringArr

Type: `string[]`

#### interpolations

Type: `Array<void | string | number | Buffer | ReadableStream | Promise>`

Promises may only resolve to all other values in the array above.

## Related

After writing this I noticed that there's already the execellent [stream-template](https://github.com/almost/stream-template)
library, which does about the same.

## Licence

MIT
