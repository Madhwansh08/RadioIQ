# Use an official Debian-based Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your application source code
COPY . .

# Expose the port that your backend uses (7000)
EXPOSE 7000

# Start the server (make sure "server.js" is your entrypoint)
CMD ["node", "server.js"]