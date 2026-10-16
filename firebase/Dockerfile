FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --global firebase-tools
WORKDIR /app
COPY firebase.json .firebaserc firestore.rules ./
EXPOSE 4000 8080 9099
