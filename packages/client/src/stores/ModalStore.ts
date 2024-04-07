import { makeAutoObservable } from 'mobx';
import { nanoid } from 'nanoid';

export interface IModal {
  id: string;
  body: JSX.Element;
}

class ModalStore {
  modals: IModal[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  show(body: JSX.Element) {
    this.modals.push({ id: nanoid(), body });
  }

  close(id: string) {
    this.modals = this.modals.filter(modal => modal.id !== id);
  }
}

export const modalStore = new ModalStore();
