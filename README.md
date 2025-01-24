# Juke Stack - NFT Music Library
IDat Schul-Projekt <br>
&copy; 2025 Luis Hutterli

# Running / Deploying
## Backend
The backend is written in Java and uses the Vert.x HTTP-Server Framework.
Here is how to run the backend locally:
```bash
mvn package java:exec
```
Due to the deployment to gcr the backend can also be run in docker:
<br>
(this also works when there is no java installed, you just need docker)

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
  --update-secrets DB_USER=DB_USER:latest,DB_PASSWORD=DB_PASSWORD:latest, \ 
  R2_ACCOUNT_ID:R2_ACCOUNT_ID:latest,R2_ACCESS_KEY:R2_ACCESS_KEY:latest,R2_SECRET_KEY:R2_SECRET_KEY:latest
```

## Frontend
The Frontend is a react-ts vite application and can be run with the following npm command:
```bash
npm run dev
```

(for this to work all dependencies need to be installed: `npm i`)

### Deployment
The Frontend first needs to be bundled:
```bash
npm run build
```

And from there the `frontend/dist/` folder can be deployed to firebase:
```bash
firebase deploy --only hosting
```

# Caching
The cover images are cached client-side using the `Cache-Control` header. The cache is set to 1 month. <br>
The header is set using a custom Cloudflare Caching rule which caches everything matching this pattern: `https://r2-images.jukestack.ch/*`

# Work
Author: Luis Hutterli, IMS Kantonsschule Frauenfeld <br>
Subject: IDat M106 <br>

## Time Spent (Tracked with Hackclub's WakaTime)
![Waka Screenshot](https://r2-images.jukestack.ch/waka-screenshot.png)
