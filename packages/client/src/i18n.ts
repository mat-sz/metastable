import { init } from 'i18not';

init({
  ns: ['civitai', 'model', 'project', 'task'],
  defaultNS: 'model',
  load: 'languageOnly',
  loadPath: `./locales/{{lng}}/{{ns}}.json`,
  fallbackLng: 'en',
});
