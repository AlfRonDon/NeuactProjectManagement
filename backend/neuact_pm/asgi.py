"""
ASGI config for neuact_pm project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuact_pm.settings')
application = get_asgi_application()
