FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json turbo.json ./
COPY packages/ ./packages/
COPY services/alert-service/ ./services/alert-service/
RUN npm install --workspace=@eldercare/alert-service
RUN npm run build --workspace=@eldercare/alert-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/alert-service/dist ./dist
COPY --from=builder /app/services/alert-service/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/app.js"]
