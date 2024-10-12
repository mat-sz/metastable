import { MRN } from './mrn.js';

describe('encodeSegment', () => {
  it('should encode characters with percent encoding', () => {
    expect(MRN.encodeSegment(':')).toEqual('%3A');
    expect(MRN.encodeSegment('%')).toEqual('%25');
    expect(MRN.encodeSegment('hello world')).toEqual('hello%20world');
    expect(MRN.encodeSegment('"testing"')).toEqual('"testing"');
    expect(MRN.encodeSegment('{testing}')).toEqual('{testing}');
    expect(MRN.encodeSegment('{❤️}')).toEqual('{%E2%9D%A4%EF%B8%8F}');
  });
});

describe('decodeSegment', () => {
  it('should decode characters with percent encoding', () => {
    expect(MRN.decodeSegment('%3A')).toEqual(':');
    expect(MRN.decodeSegment('%25')).toEqual('%');
  });
});

describe('serialize', () => {
  it('should serialize MRNs', () => {
    expect(
      MRN.serialize({
        segments: ['project', '<current>', 'file', 'input', '00001.png'],
      }),
    ).toEqual('mrn:project:<current>:file:input:00001.png');
    expect(
      MRN.serialize({
        segments: ['project', '<current>', 'file', 'input', '00001.png'],
        query: {
          hello: 'world',
        },
      }),
    ).toEqual('mrn:project:<current>:file:input:00001.png?hello=world');
  });
});

describe('parse', () => {
  it('should parse MRNs', () => {
    expect(MRN.parse('mrn:project:<current>:file:input:00001.png')).toEqual({
      segments: ['project', '<current>', 'file', 'input', '00001.png'],
      query: expect.anything(),
    });

    const withQuery = MRN.parse(
      'mrn:project:<current>:file:input:00001.png?hello=world',
    );
    expect(withQuery.segments).toEqual([
      'project',
      '<current>',
      'file',
      'input',
      '00001.png',
    ]);
    expect(withQuery.query.get('hello')).toEqual('world');
  });

  it('should throw on invalid MRNs', () => {
    expect(() => MRN.parse('test:abc')).toThrow();
    expect(() => MRN.parse('mrn:abc?1234?567')).toThrow();
  });
});
