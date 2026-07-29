FROM node:20-alpine AS build
WORKDIR /usr/src/app
ARG APP_NAME
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nest build ${APP_NAME}

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/src/app/dist ./dist
CMD node dist/apps/${APP_NAME}/main.js
