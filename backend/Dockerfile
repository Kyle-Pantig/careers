# Use the official Bun image
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock* /temp/prod/
RUN cd /temp/prod && bun install --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Generate Prisma Client
RUN bunx prisma generate --schema=prisma/schema.prisma

# [Optional] Run tests here if you have them
# RUN bun test

# Final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/node_modules/.prisma node_modules/.prisma
COPY --from=prerelease /app/node_modules/@prisma node_modules/@prisma
COPY --from=prerelease /app/node_modules/.bin node_modules/.bin 
COPY --from=prerelease /app/src src
COPY --from=prerelease /app/prisma prisma
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/index.ts .

# Expose the API port
EXPOSE 3001

# Run the app
CMD [ "bun", "run", "start" ]
