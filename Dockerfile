FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node public ./public
COPY --chown=node:node server ./server
USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]
