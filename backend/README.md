## Docker Build Image

```
docker build -t express-server:dockerfile .
```

## Docker Run Image By Itself

```
docker run -p 3000:3000 -d express-server:dockerfile
```

## Run Both Python Microservice and Nodejs Server

```
docker-compose build
```
```
docker-compose up
```

## Instructions

To run the backend server

```
node server.js
```

or

```
npm start
```
