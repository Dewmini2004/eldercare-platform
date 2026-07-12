FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json turbo.json ./
COPY packages/ ./packages/
COPY services/payment-service/ ./services/payment-service/
RUN npm install --workspace=@eldercare/payment-service
RUN npm run build --workspace=@eldercare/payment-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/payment-service/dist ./dist
COPY --from=builder /app/services/payment-service/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/app.js"]
