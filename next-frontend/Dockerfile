# Base image for build step
FROM node:20 AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install


# Copy project files and build
COPY . .
RUN npm run build

# Production runtime image
FROM node:20

WORKDIR /app
COPY --from=builder /app ./

# Expose frontend port
EXPOSE 3000

CMD ["npm", "run", "start" ]

