# Based on: https://github.com/knative/docs/tree/e46b9317949ac12653b91849a1d288ad02d4a541/code-samples/serving/hello-world/helloworld-java-spark
# Stage 1: build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests

# Stage 2: run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY verify-mail.html .
COPY --from=builder /app/target/*-fat.jar backend.jar

EXPOSE 8080
CMD ["java", "-jar", "backend.jar"]