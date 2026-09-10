import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/uz-latn';
import App from './App.tsx';
import './index.css';

dayjs.locale('uz-latn');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
