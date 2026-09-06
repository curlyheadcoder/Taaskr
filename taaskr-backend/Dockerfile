FROM eclipse-temurin:17-jdk AS build

WORKDIR /build

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

ENV JAVA_OPTS="-XX:+UseSerialGC -Xms64m -Xmx320m -XX:MaxMetaspaceSize=128m -XX:+ExitOnOutOfMemoryError"

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
