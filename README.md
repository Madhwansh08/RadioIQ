# RadioIQ 

RadioIQ is a project aimed at providing a seamless interface for analyzing radio signals and visualizing data for better insights.

## Features

- Real-time signal processing
- Customizable visualization options
- Support for multiple data formats
- Scalable backend with Node.js and Express
- Modern frontend built with React and Vite
- Integration with MongoDB Atlas for data storage

## PORT Configuration
App->Client->PORT->5173
App->Server->PORT->7000
App->Mongodb->PORT->27017
App->Redis->PORT->6379
Pyfeatures->PORT->8000
ML->PORT->18080

## Installation

### Prerequisites

- Node.js and npm installed
- MongoDB Atlas account and connection string

### Steps

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/RadioIQ.git
    cd RadioIQ
    ```

2. Set up the App -> Server:
    ```bash
    cd server
    npm install
    ```

3. Set up the App -> Client:
    ```bash
    cd client
    npm install
    ```

4. Configure environment variables for development:
    - Create a `.env` file in the `server` folder with the following:
      ```
      MONGO_URI=localhost:27017
      PORT=5000
      REDIS_URL=localhost:6379
      ```

## Usage

1. Start the backend server:
    ```bash
    cd server
    nodemon server
    ```

2. Start the frontend development server:
    ```bash
    cd client
    npm run dev
    ```

## Docker App Setup

1. Configure environment variables:
    - In Server `.env` file:
      ```
      MONGO_URI=mongo:27017
      PORT=5000
      REDIS_URL=redis:6379
      ```
2. Go to the App Root Directory:
     ```
      docker compose build
     docker compose up
      ```

## PyFeatures

1. Go to the Project Root Directory:
     ```bash
    cd pyfeatures
    ```
     
2. In pyfeatures 
      ```bash
    docker compose up -d
    ```
      
## ML

1- Firstly we need to get the Models from the drive link

2- Go to the ml Directory:
  ```bash
    make build
make start
    ```



       
   

    
    
