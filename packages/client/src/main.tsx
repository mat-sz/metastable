import React from 'react';
import ReactDOM from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPC, TRPCClient } from '@api';

import { App } from './App.tsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <TRPC.Provider client={TRPCClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </TRPC.Provider>
    </DndProvider>
  </React.StrictMode>,
);

postMessage({ payload: 'removeLoading' }, '*');
