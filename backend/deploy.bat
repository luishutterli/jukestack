@echo off

docker build -t jukestack-backend .

docker tag jukestack-backend gcr.io/jukestack/jukestack-backend
docker push gcr.io/jukestack/jukestack-backend

rem europe-west3 = Frankfurt
rem europe-west6 = Zürich
gcloud run deploy jukestack-backend --image gcr.io/jukestack/jukestack-backend --platform managed --region europe-west3 --allow-unauthenticated --update-secrets="DB_USER=DB_USER:latest,DB_PASSWORD=DB_PASSWORD:latest,R2_ACCOUNT_ID=R2_ACCOUNT_ID:latest,R2_ACCESS_KEY=R2_ACCESS_KEY:latest,R2_SECRET_KEY=R2_SECRET_KEY:latest"