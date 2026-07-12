FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json turbo.json ./
COPY packages/ ./packages/
COPY services/api-gateway/ ./services/api-gateway/
RUN npm install --workspace=@eldercare/api-gateway
RUN npm run build --workspace=@eldercare/api-gateway

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/app.js"]
