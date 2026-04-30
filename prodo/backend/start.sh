#!/bin/bash
cd /home/rohith/desktop/NeuactProjectManagement/prodo/backend
source venv/bin/activate
exec daphne \
  --bind 0.0.0.0 \
  --port 9017 \
  --access-log /home/rohith/desktop/NeuactProjectManagement/prodo/logs/backend-access.log \
  neuact_pm.asgi:application
