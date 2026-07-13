import { Amplify } from "aws-amplify";
import outputs from "./amplify_outputs.json";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from 'react-oidc-context';

Amplify.configure(outputs);


const cognitoConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_CK94sKjaC",
  client_id: "51fu0mfnpb0r0e319ftppvcbaf",
  redirect_uri: window.location.hostname === 'localhost' ? 'http://localhost:3000/' : 'https://titanassets.dev/',
  response_type: "code",
  scope: "openid email profile aws.cognito.signin.user.admin phone",
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
