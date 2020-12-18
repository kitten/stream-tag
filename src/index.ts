import { Readable as ReadableStream } from 'stream';

export type RawInterpolation =
  | void
  | string
  | number
  | Buffer

export type ValInterpolation =
  | RawInterpolation
  | ReadableStream
  | Promise<RawInterpolation>;

export type Interpolation =
  | ValInterpolation
  | (() => ValInterpolation);

const isStream = (arg: any): arg is ReadableStream => (
  arg && typeof arg === 'object' && typeof arg.pipe === 'function'
);

const isPromise = (arg: any): arg is Promise<RawInterpolation> => (
  arg && typeof arg === 'object' && typeof arg.then === 'function'
);

const toString = (arg: RawInterpolation): string => {
  if (typeof arg === 'number' || arg) {
    return `${arg}`;
  }

  return '';
};

export class ReadableTagStream extends ReadableStream {
  strings: TemplateStringsArray;
  interpolations: Interpolation[];

  size: number;
  index: number;
  interrupted: boolean;
  hasActivePromise: boolean;
  activeStream?: ReadableStream;
  queue: string[];

  constructor(strings: TemplateStringsArray, interpolations: Interpolation[]) {
    super();
    this.strings = strings;
    this.interpolations = interpolations;

    this.size = strings.length + interpolations.length;
    this.index = 0;
    this.interrupted = false;
    this.hasActivePromise = false;
    this.queue = [];
  }

  queueValue(value: RawInterpolation) {
    this.queue.unshift(toString(value));
    this.pushValues();
  }

  end(err?: Error) {
    this.interrupted = true;
    if (err) this.emit('error', err);
    this.emit('close');
  }

  queuePromise(promise: Promise<RawInterpolation>) {
    this.hasActivePromise = true;

    promise.then(data => {
      this.hasActivePromise = false;
      this.queueValue(data);
    });
  }

  queueStream(stream: ReadableStream) {
    this.activeStream = stream;

    stream.on('readable', () => {
      if (!this.interrupted) {
        this.pushValues();
      }
    });

    stream.on('error', error => {
      this.end(error)
    });

    stream.on('end', () => {
      this.activeStream = undefined;
      this.pushValues();
    });
  }

  pushValues() {
    if (this.hasActivePromise) {
      return;
    } else if (this.activeStream !== undefined) {
      let chunk;
      while (!this.interrupted && chunk !== null) {
        chunk = this.activeStream.read();
        if (chunk !== null) {
          this.interrupted = this.push(toString(chunk)) === false;
        }
      }

      return;
    }

    while (!this.interrupted) {
      let nextString = '';

      if (this.queue.length > 0) {
        nextString = this.queue.pop();
      } else {
        const index = this.index;
        const isString = index % 2 === 0;
        this.index = index + 1 | 0;

        if (index >= this.size) {
          return this.push(null);
        } else if (isString) {
          nextString = this.strings[index / 2];
        } else {
          let interpolation = this.interpolations[(index - 1) / 2];
          if (typeof interpolation === 'function') {
            interpolation = interpolation();
          }

          if (isPromise(interpolation)) {
            return this.queuePromise(interpolation);
          } else if (isStream(interpolation)) {
            return this.queueStream(interpolation);
          } else {
            nextString = toString(interpolation);
          }
        }
      }

      if (nextString !== '') {
        this.interrupted = this.push(nextString) === false;
      }
    }
  }

  _read() {
    this.interrupted = false;
    this.pushValues();
  }
}

const streamTag = (
  strings: TemplateStringsArray,
  ...interpolations: Interpolation[]
) => new ReadableTagStream(strings, interpolations);

export default streamTag;
