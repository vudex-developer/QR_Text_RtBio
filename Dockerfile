FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY index.html styles.css server.mjs ./
COPY src ./src
COPY docs ./docs
COPY EXTERNAL_HANDOFF.md README.md ./

ENV HOST=0.0.0.0
ENV PORT=4175
ENV DATA_DIR=/app/data

EXPOSE 4175

CMD ["npm", "start"]
