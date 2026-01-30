FROM docker.io/oven/bun:1.1-slim

WORKDIR /app

COPY package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 5173

CMD ["bun", "run", "preview", "--host"]
