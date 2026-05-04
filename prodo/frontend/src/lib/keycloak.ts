import Keycloak from "keycloak-js";

// localhost uses 8080 directly, remote users use 8083 (proxy that bypasses hostname-strict)
const keycloakUrl = typeof window !== "undefined"
  ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080/keycloak"
    : `https://${window.location.hostname}:8083/keycloak`
  : "http://localhost:8080/keycloak";

const keycloakConfig = {
  url: keycloakUrl,
  realm: "neuract-project-management",
  clientId: "neuact-pm",
};

let keycloakInstance: Keycloak | null = null;

export function getKeycloak(): Keycloak {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
}
