import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from 'react-oidc-context';

const cognitoConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_CK94sKjaC",
  client_id: "51fu0mfnpb0r0e319ftppvcbaf",
  redirect_uri: "https://main.dzqkd5uk2wwnj.amplifyapp.com/",
  response_type: "code",
  scope: "openid email profile",
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
