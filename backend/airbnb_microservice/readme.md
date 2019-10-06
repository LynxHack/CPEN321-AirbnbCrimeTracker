# Python Airbnb Microservice

## Manually Running It

### Setting up Isolated Venv
```
virtualenv --no-site-packages venv
```

Working in virtualenv

```
. venv/bin/activate
```

### API Documentation

https://github.com/nderkach/airbnb-python

## Running Via Docker Individually

Building new docker image
```
docker build -t "flask-airbnb:dockerfile" .
```

Running the image
```
docker run -p 5000:5000 flask-airbnb:dockerfile
```
