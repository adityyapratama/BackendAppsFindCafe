FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN npx prisma generate

COPY src ./src
RUN npx tsc && npm prune --omit=dev

EXPOSE 3000

# ponytail: db push at start so build never needs a live DB; external postgres supplies DATABASE_URL
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/app.js"]
