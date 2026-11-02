FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system pennywise && useradd --system --gid pennywise pennywise
COPY --from=build /build/target/pennywise-0.0.1-SNAPSHOT.jar app.jar
USER pennywise
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
