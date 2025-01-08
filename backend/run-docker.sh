#!/bin/bash
docker stop jukestack-backend-container & docker rm jukestack-backend-container
docker run --name jukestack-backend-container --env-file .env -p 8080:8080 jukestack-backend
