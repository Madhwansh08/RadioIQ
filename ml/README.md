# Model Setup

1. Download all the models from [Google Drive](https://drive.google.com/drive/folders/1igN-u9_GBYGL_lV-Xe5QrMe2ankuDPVI?usp=sharing)
2. Place the downloaded models in the `src/models` directory

*Note: These models are required for the application to function properly.*

# How to start the server cotainer

### Build the image
```sh
make build
```
You may receive an error which says that the ports are occupied. In that case, you can change the ports exposed in `docker-compose.yml` file to a port which is not occupied.

### Run the container
```sh
make start
```

### Shutdown the container
```sh
make stop
```

# How to run tests

### First ensure that the Server container is running

```sh
make start
```

### Run all the tests

```sh
make pytest
```

### Run tests with with arguments (ex: sanity marker)

```sh
make pytest PYTEST_ARGS="-m sanity"
```
# Running Jupyter Notebook inside docker

### Install Jupyter Container

```sh
make install-jupyter
```

### Start Jupyter Container

```sh
make run-container
```
Jupyter will be available at `http://localhost:18888`, or whatever port you have defined in `docker-compose.yml` file.

### Get jupyter notebook token

```sh
make get-tocken
```

### Run Jupyter Notebook in background

```sh
make run-jupyter-bg
```

### View jupyter logs

```sh
make logs
```

# Running debugger in vs-code

The debugger is exposed at port `5678` by default. You can connect to it using this configuration in the vs-code.

```json
{
    "name": "cxr-app debug",
    "type": "python",
    "request": "attach",
    "connect": {
        "host": "localhost",
        "port": 5678
    },
    "pathMappings": [
        {
            "localRoot": "$path/to/cxr-app/",
            "remoteRoot": "/code"
        }
    ]
}
```