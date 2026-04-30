"""
Keycloak JWT Bearer Token Authentication for DRF.
Validates access tokens issued by Keycloak without requiring session/cookie auth.
"""

import json
import logging
import jwt
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)
User = get_user_model()

_jwks_cache = None


def _get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        resp = requests.get(settings.OIDC_OP_JWKS_ENDPOINT, timeout=5)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


class KeycloakJWTAuthentication(BaseAuthentication):
    """
    Authenticate requests with a Keycloak-issued Bearer JWT.
    Creates a Django user on first login (syncs username, email, name).
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]

        try:
            jwks = _get_jwks()
            # Decode header to find the key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            # Find matching key
            rsa_key = None
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                    break

            if rsa_key is None:
                # Refresh JWKS cache and retry
                global _jwks_cache
                _jwks_cache = None
                jwks = _get_jwks()
                for key in jwks.get("keys", []):
                    if key["kid"] == kid:
                        rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                        break

            if rsa_key is None:
                raise AuthenticationFailed("No matching key found in JWKS")

            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=[settings.OIDC_RP_SIGN_ALGO],
                audience="account",
                options={"verify_aud": False},
            )

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f"Invalid token: {e}")
        except requests.RequestException as e:
            raise AuthenticationFailed(f"Cannot validate token: {e}")

        # Get or create user
        username = payload.get("preferred_username", "")
        email = payload.get("email", "")
        first_name = payload.get("given_name", "")
        last_name = payload.get("family_name", "")

        if not username:
            raise AuthenticationFailed("Token missing preferred_username")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        if not created:
            changed = False
            if email and user.email != email:
                user.email = email
                changed = True
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                changed = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                changed = True
            if changed:
                user.save()

        return (user, payload)
