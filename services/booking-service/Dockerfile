FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json turbo.json ./
COPY packages/ ./packages/
COPY services/booking-service/ ./services/booking-service/
RUN npm install --workspace=@eldercare/booking-service
RUN npm run build --workspace=@eldercare/booking-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/booking-service/dist ./dist
COPY --from=builder /app/services/booking-service/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/app.js"]
