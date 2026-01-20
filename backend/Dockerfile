# Use official Bun image with Debian (has OpenSSL 3)
FROM oven/bun:1 AS base
WORKDIR /app

# Install OpenSSL 3
RUN apt-get update && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source code
COPY . .

# Expose port
ENV PORT=3001
EXPOSE 3001

# Start the app
CMD ["bun", "run", "index.ts"]
