export function resolveUrlToMrn(url: string) {
  const searchParamsIndex = url.indexOf('?');
  const encodedMrn = url.substring(
    url.lastIndexOf('/') + 1,
    searchParamsIndex === -1 ? undefined : searchParamsIndex,
  );

  return decodeURIComponent(encodedMrn);
}
