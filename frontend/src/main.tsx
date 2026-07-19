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

// Fix zoom inconsistency on deployed environments — set zoom to 80%
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  document.documentElement.style.zoom = '0.8';
}

createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID || ""}>
      <App />
    </GoogleOAuthProvider>
  </ApolloProvider>
);
