import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'trpc-electron/main';

contextBridge.exposeInMainWorld('electronConfig', {
  isMac: process.platform === 'darwin',
});

process.once('loaded', async () => {
  exposeElectronTRPC();
});

function domReady(
  condition: DocumentReadyState[] = ['complete', 'interactive'],
) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      parent.removeChild(child);
    }
  },
};

function loading() {
  const className = `electron_preload_loader`;
  const styleContent = `
.${className} {
  width: 45px;
  aspect-ratio: 1;
  --c:no-repeat repeating-linear-gradient(90deg,#77f 0 calc(100%/7),#77f0 0 calc(200%/7));
  background: var(--c),var(--c),var(--c),var(--c);
  background-size: 140% 26%;
  animation: l26 .75s infinite linear;
}
@keyframes l26 {
 0%,
 5%   {background-position:0    calc(0*100%/3),0    calc(1*100%/3),0    calc(2*100%/3),0    calc(3*100%/3)}
 20%  {background-position:50%  calc(0*100%/3),0    calc(1*100%/3),0    calc(2*100%/3),0    calc(3*100%/3)}
 40%  {background-position:100% calc(0*100%/3),50%  calc(1*100%/3),0    calc(2*100%/3),0    calc(3*100%/3)}
 60%  {background-position:100% calc(0*100%/3),100% calc(1*100%/3),50%  calc(2*100%/3),0    calc(3*100%/3)}
 80%  {background-position:100% calc(0*100%/3),100% calc(1*100%/3),100% calc(2*100%/3),50%  calc(3*100%/3)}
 95%,
 100% {background-position:100% calc(0*100%/3),100% calc(1*100%/3),100% calc(2*100%/3),100% calc(3*100%/3)}
}

.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #11111a;
  z-index: 9;
}
    `;
  const oStyle = document.createElement('style');
  const oDiv = document.createElement('div');

  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.className = 'app-loading-wrap';
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

const { appendLoading, removeLoading } = loading();
domReady().then(appendLoading);

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading();
};

setTimeout(removeLoading, 4999);
