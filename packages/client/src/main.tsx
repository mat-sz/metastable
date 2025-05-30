import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'wouter';

import { API, TRPC } from '$api';
import { refreshAll } from '$store/actions.ts';
import { App } from './App.tsx';
import './onError.ts';
import './i18n.ts';

refreshAll();

const queryClient = new QueryClient();

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <TRPC.Provider client={API} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="Loading...">
          <Router>
            <App />
          </Router>
        </Suspense>
      </QueryClientProvider>
    </TRPC.Provider>
  </React.StrictMode>,
);

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
