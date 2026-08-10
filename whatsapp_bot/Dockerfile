FROM node:20-alpine

WORKDIR /app/whatsapp_bot

COPY whatsapp_bot/package*.json ./
RUN npm ci --only=production

COPY whatsapp_bot ./

ENV NODE_ENV=production

CMD ["node", "bot.js"]
