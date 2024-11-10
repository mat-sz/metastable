import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactDOM from 'react-dom/client';

import { TRPC, TRPCClient } from '$api';
import { App } from './App.tsx';
import './onError.ts';
import './i18n.ts';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <TRPC.Provider client={TRPCClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback="Loading...">
            <App />
          </Suspense>
        </QueryClientProvider>
      </TRPC.Provider>
    </DndProvider>
  </React.StrictMode>,
);

postMessage({ payload: 'removeLoading' }, '*');

// Prevent zoom.
document.addEventListener(
  'touchmove',
  (event: any) => {
    event = event.originalEvent || event;
    if (typeof event.scale !== 'undefined' && event.scale !== 1) {
      event.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener(
  'wheel',
  e => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false },
);
