# Production Dockerfile for MANAS360 backend (Node.js + Prisma + PostgreSQL)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build && npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
