import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { ApolloProvider } from "@apollo/client/react";
import client from "./lib/apolloClient";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { env } from "./lib/env";

// Initialize i18n
import "./lib/i18n";

// Initialize automatic error capture (GraphQL errors, runtime errors, unhandled rejections)
import { initErrorCapture, setReportClient } from "./lib/errorCapture";
setReportClient(client);
initErrorCapture();

// Default 95% zoom — users can adjust via zoom controls in the portal
if (typeof window !== 'undefined') {
  const savedZoom = localStorage.getItem('app_zoom');
  const defaultZoom = '0.97';
  document.documentElement.style.zoom = savedZoom || defaultZoom;
}

createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID || ""}>
      <App />
    </GoogleOAuthProvider>
  </ApolloProvider>
);
