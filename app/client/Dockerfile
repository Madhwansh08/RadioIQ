# Use an official Debian-based Node.js image
FROM node:20.19.0

# Set the working directory inside the container
WORKDIR /app

# Install required system packages (if needed)
RUN apt-get update && apt-get install -y bash net-tools procps curl && rm -rf /var/lib/apt/lists/*

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application files
COPY . .

# (Optional) Install Vite globally if your tools require it
RUN npm install -g vite

# Run the production build once during image build
RUN npm run build

# Expose the port for Vite dev server
EXPOSE 5173

# Start the Vite development server on container run
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
