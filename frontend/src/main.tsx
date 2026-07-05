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

createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID || ""}>
      <App />
    </GoogleOAuthProvider>
  </ApolloProvider>
);
