FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo

FROM base AS builder
COPY package.json turbo.json ./
COPY packages/ ./packages/
COPY services/ai-service/ ./services/ai-service/
RUN npm install
RUN npm run build --filter=@eldercare/ai-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/ai-service/dist ./dist
COPY --from=builder /app/services/ai-service/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3007
CMD ["node", "dist/app.js"]
