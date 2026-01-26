# Start with a lightweight Node.js operating system
FROM node:20-alpine

# Create a folder inside the container for your app
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of your code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Open the port your app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
