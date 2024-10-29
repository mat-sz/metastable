const ENCODE_CHARS_REGEXP =
  /(?:[^\x21-\x39\x3B-\x3E\x40-\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g;
const UNMATCHED_SURROGATE_PAIR_REGEXP =
  /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;
const UNMATCHED_SURROGATE_PAIR_REPLACE = '$1\uFFFD$2';

function decodeSegment(segment: string) {
  return decodeURIComponent(segment);
}

function encodeSegment(segment: string) {
  return segment
    .replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE)
    .replace(ENCODE_CHARS_REGEXP, encodeURIComponent);
}

const MRN_IDENTIFIER = 'mrn';
const MRN_SEGMENT_SEPARATOR = ':';
const MRN_QUERY_SEPARATOR = '?';

function parse(mrn: string): MRNDataParsed {
  if (!mrn.startsWith(`${MRN_IDENTIFIER}${MRN_SEGMENT_SEPARATOR}`)) {
    throw new Error('Invalid MRN: doesn\'t begin with "mrn:"');
  }

  const querySplit = mrn.split(MRN_QUERY_SEPARATOR);
  if (querySplit.length > 2) {
    throw new Error('Invalid MRN: contains two query separators.');
  }

  const split = querySplit[0].split(MRN_SEGMENT_SEPARATOR);
  split.shift();
  return {
    segments: split.map(segment => decodeSegment(segment)),
    query: new URLSearchParams(querySplit[1] || ''),
  };
}

function serialize({ segments, query }: MRNData) {
  let mrn = [MRN_IDENTIFIER, ...segments]
    .map(segment => encodeSegment(segment))
    .join(MRN_SEGMENT_SEPARATOR);
  if (query) {
    mrn += `?${new URLSearchParams(query).toString()}`;
  }
  return mrn;
}

export interface MRNData {
  segments: string[];
  query?: URLSearchParams | string | Record<string, string | string[]>;
}

export interface MRNDataParsed extends MRNData {
  query: URLSearchParams;
}

export const MRN = {
  parse,
  serialize,
  decodeSegment,
  encodeSegment,
};
