import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain="wolflogic-ai.us.auth0.com"
      clientId="XwEDQX2h1lGRbcQek1OTodDdPmgI8Sl7"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://api.wolflogic-ai.com",
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
);
