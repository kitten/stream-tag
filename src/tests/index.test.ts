import { createElement } from 'react';
import { renderToNodeStream } from 'react-dom/server';
import streamToString from 'stream-to-string';
import streamTag from '../index';

describe('streamTag', () => {
  it('handles strings-only correctly', () => {
    const stream = streamTag`test`;

    return streamToString(stream).then(string => {
      expect(string).toBe('test');
    });
  });

  it('handles empty templates correctly', () => {
    const stream = streamTag``;

    return streamToString(stream).then(string => {
      expect(string).toBe('');
    });
  });

  it('handles falsy templates correctly', () => {
    const stream = streamTag`${undefined}${null}${false}`;

    return streamToString(stream).then(string => {
      expect(string).toBe('');
    });
  });

  it('handles string interpolations correctly', () => {
    const stream = streamTag`test${'test'}`;

    return streamToString(stream).then(string => {
      expect(string).toBe('testtest');
    });
  });

  it('handles number interpolations correctly', () => {
    const stream = streamTag`${0}test${9}`;

    return streamToString(stream).then(string => {
      expect(string).toBe('0test9');
    });
  });

  it('handles promise interpolations correctly', () => {
    const stream = streamTag`x${Promise.resolve('test')}x`;

    return streamToString(stream).then(string => {
      expect(string).toBe('xtestx');
    });
  });

  it('handles nested streams correctly', () => {
    const stream = streamTag`x${streamTag`test`}x`;

    return streamToString(stream).then(string => {
      expect(string).toBe('xtestx');
    });
  });

  it('handles Buffers correctly', () => {
    const stream = streamTag`x${Buffer.from('test')}x`;

    return streamToString(stream).then(string => {
      expect(string).toBe('xtestx');
    });
  });

  describe('React SSR Integration', () => {
    it('correctly interpolates renderToNodeStream', () => {
      const tree = createElement('div', { className: 'test' }, (
        createElement('h1', {}, 'Hello World!')
      ));

      const stream = streamTag`
        <html>
          <body>
            ${renderToNodeStream(tree)}
          </body>
        </html>
      `;

      return streamToString(stream).then(string => {
        expect(string).toMatchSnapshot();
      });
    });
  });
});
