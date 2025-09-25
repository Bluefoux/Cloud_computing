# Base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Set default command
CMD ["npm", "run", "start"]