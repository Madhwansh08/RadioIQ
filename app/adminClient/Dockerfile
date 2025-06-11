# Use an official Debian-based Node.js image
FROM node:20.19.0

# Set the working directory inside the container
WORKDIR /app

# Install required system packages (if needed)
RUN apt-get update && apt-get install -y bash net-tools procps curl && rm -rf /var/lib/apt/lists/*

# Copy package files and install all dependencies (including devDependencies like Vite)
COPY package*.json ./
RUN npm install

# Copy the rest of your application files
COPY . .

# (Optional) Ensure Vite is installed globally (if your scripts require it)
RUN npm install -g vite

# Expose the port on which Vite will run (5173)
EXPOSE 5174

# Start the Vite development server, binding to all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]