let hasError = false;

window.onerror = (_a, _b, _c, _d, error) => {
  if (hasError) {
    return;
  }

  hasError = true;
  const wrapperEl = document.createElement('div');
  wrapperEl.classList.add('onError');

  const titleEl = document.createElement('h2');
  titleEl.innerText = 'Uncaught error';

  const preEl = document.createElement('pre');
  preEl.innerText = error
    ? (window as any).chrome
      ? (error.stack ?? error.toString())
      : `${error.toString()}\n${error.stack}`
    : 'Unknown error';

  const refreshEl = document.createElement('button');
  refreshEl.innerText = 'Refresh';
  refreshEl.addEventListener('click', () => window.location.reload());

  wrapperEl.append(titleEl);
  wrapperEl.append(preEl);
  wrapperEl.append(refreshEl);

  document.body.append(wrapperEl);
};
