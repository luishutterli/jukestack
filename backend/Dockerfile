# Based on: https://github.com/knative/docs/tree/e46b9317949ac12653b91849a1d288ad02d4a541/code-samples/serving/hello-world/helloworld-java-spark
# Stage 1: build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests

# Stage 2: build native
FROM ghcr.io/graalvm/native-image-community:21.0.2-muslib-ol8-20240116 AS native-image-builder
RUN microdnf install -y gcc zlib-devel libstdc++-static glibc-static


WORKDIR /app

COPY --from=builder /app/target/*-fat.jar /app/app.jar
RUN native-image \
    --no-fallback \
    --verbose \
    --static --libc=musl \
    -H:TempDirectory=/app/tmp \
    -H:+UnlockExperimentalVMOptions \
    -H:Name=app \
    -H:Class=io.vertx.core.Launcher \
    -cp app.jar


# Stage 3: Run
FROM alpine:latest
WORKDIR /app

COPY --from=native-image-builder /app/app .

EXPOSE 8080
CMD ["./app"]