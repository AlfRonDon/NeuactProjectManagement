import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: "http://100.90.185.31:8083/keycloak",
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
