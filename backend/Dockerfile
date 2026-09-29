# OptiSight API (Express + socket.io). Build context is backend/.
FROM node:22-slim

# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# tsc and @types are devDependencies but needed for the build.
COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

# Sync the schema to the database, then start. Render injects PORT.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
