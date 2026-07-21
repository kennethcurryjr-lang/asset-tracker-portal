import { Amplify } from "aws-amplify";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Configure AWS Amplify directly with your User Pool credentials
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_CK94sKjaC',
      userPoolClientId: '51fu0mfnpb0r0e319ftppvcbaf',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
