import { makeAutoObservable } from 'mobx';

class UIStore {
  systemTheme: 'dark' | 'light';

  constructor() {
    makeAutoObservable(this);

    const themeMatch = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemTheme = themeMatch.matches ? 'dark' : 'light';
    themeMatch.addEventListener('change', e => {
      this.systemTheme = e.matches ? 'dark' : 'light';
    });
  }
}

export const uiStore = new UIStore();
