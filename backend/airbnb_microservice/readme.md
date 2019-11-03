# Python Airbnb Microservice

## Manually Running It

### Setting up Isolated Venv
```shell
virtualenv --no-site-packages venv
```

Working in virtualenv

```shell
. venv/bin/activate
```

### API Documentation

<https://github.com/nderkach/airbnb-python>

## Running Via Docker Individually

Building new docker image
```shell
docker build -t "flask-airbnb:dockerfile" .
```

Running the image
```shell
docker run -p 5000:5000 flask-airbnb:dockerfile
```
