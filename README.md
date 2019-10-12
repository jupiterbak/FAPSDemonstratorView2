# FAPS Demonstrator Customer App Backend

This Application serves as the backend for the FAPS Demonstrator customer App. The App is used to start and monitoring a production order to the FAPS Demonstrator.
The Backend exposes a REST API to post and retrieve a list of production order. The status of a production order can also be polled via the same API. Please refer to the [section](#api-description)

Please refer to this section to see how run the Backend as a microservice inside a docker container.

## Requirements

* NodeJs : The Backend requires NodeJs and a node global package npm.
* Git
* Dockers: Since the App need a databse, we used MongoDB that we instantiate in a docker container. Thereforre Docker is neccessary. Please refer to the docker documentation for docker installation.

## Installation

Step 1: Clone this repo and install the dependencies.

```bash
git clone https://github.com/jupiterbak/FAPSDemonstratorCustomerBackend.git
cd FAPSDemonstratorCustomerBackend
```

```bash
npm install
```

Step 2: Start the MongoDB Docker container.

```bash
docker run -p 27017:27017 --name FAPSCustomerAppBackendMongoDB -d mongo
```

This command will start a Docker container locally and expose the mongoDB default port 27017.

## Start

To start the server, run the following

```bash
npm start
```

The Rest API is now accessible at [http://localhost:3000](http://localhost:3000).

## Deploy to Heroku
You can also deploy this app to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)


## Deploy as a Microservice 
You can also deploy the server as a microservice inside a Docker container:

Step 1: Clone the repo

```bash
git clone https://github.com/jupiterbak/FAPSDemonstratorCustomerBackend.git
cd FAPSDemonstratorCustomerBackend
```

Step 2: Build the Docker image

```bash
docker build -t fapsdemonstratorcustomerbackend .
```

Step 3: Run the Docker container locally:

```bash
docker run -p 8080:3000 -d fapsdemonstratorcustomerbackend
```

Step 3_a: Run the Docker container in the cluster:

```bash
sudo docker-compose build
```
```bash
docker stack deploy --compose-file swarm_deploy.yml FAPSCustomerAppBackend
```
<!-- CONTRIBUTING -->
## Contributing

Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->
## Contact

Jupiter Bakakeu - [@JBakakeu](https://twitter.com/JBakakeu) - jupiter.bakakeu@gmail.com

Project Link: [https://github.com/jupiterbak/FAPSDemonstratorCustomerBackend](https://github.com/jupiterbak/FAPSDemonstratorCustomerBackend)
