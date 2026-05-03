FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads/profiles uploads/submissions uploads/materials

EXPOSE 3000

CMD ["node", "app.js"]
