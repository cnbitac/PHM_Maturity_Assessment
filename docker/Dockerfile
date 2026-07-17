FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4173 \
    WAIC_DATA_DIR=/app/data

COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

RUN mkdir -p /app/data && chown node:node /app/data

USER node

EXPOSE 4173
VOLUME ["/app/data"]

CMD ["npm", "start"]
