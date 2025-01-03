#!/bin/bash
set -e

docker build -t jukestack-backend .

docker tag jukestack-backend gcr.io/jukestack/jukestack-backend
docker push gcr.io/jukestack/jukestack-backend

# europe-west3 = Frankfurt
# europe-west6 = Zürich
gcloud run deploy jukestack-backend \
  --image gcr.io/jukestack/jukestack-backend \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --update-secrets DB_USER=DB_USER:latest,DB_PASSWORD=DB_PASSWORD:latest