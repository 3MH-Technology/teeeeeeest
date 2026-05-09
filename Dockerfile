# Next.js Dockerfile for the platform
FROM node:20-alpine

WORKDIR /app

# We only copy package files first for caching
COPY package.json ./
RUN npm install

# Copy all files
COPY . .

# Build the project
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
