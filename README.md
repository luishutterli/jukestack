# Juke Stack - NFT Music Library
IDat Schul-Projekt <br>
&copy; 2024 Luis Hutterli

# Running / Deploying
## Backend
The backend is written in Java and uses the Vert.x HTTP-Server Framework.
Here is how to run the backend locally:
```bash
mvn package java:exec
```
Due to the deployment to gcr the backend can also be run in docker:
```bash
# Building:
docker build -t jukestack-backend .

# Running:
docker run --name jukestack-backend-container --env-file .env -p 8080:8080 jukestack-backend
```

### Deployment
The built docker container is uploaded to googles container registry and from there the Cloud Run service is created:
```bash
# Pushing to conatiner registry:
docker tag jukestack-backend gcr.io/jukestack/jukestack-backend
docker push gcr.io/jukestack/jukestack-backend

# europe-west3 = Frankfurt
# europe-west6 = Zürich

# Creating Cloud Run service:
gcloud run deploy jukestack-backend \
  --image gcr.io/jukestack/jukestack-backend \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --update-secrets DB_USER=DB_USER:latest,DB_PASSWORD=DB_PASSWORD:latest,R2_ACCOUNT_ID:R2_ACCOUNT_ID:latest,R2_ACCESS_KEY:R2_ACCESS_KEY:latest,R2_SECRET_KEY:R2_SECRET_KEY:latest
```