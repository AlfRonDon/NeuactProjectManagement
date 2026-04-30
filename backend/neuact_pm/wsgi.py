"""
WSGI config for neuact_pm project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuact_pm.settings')
application = get_wsgi_application()
