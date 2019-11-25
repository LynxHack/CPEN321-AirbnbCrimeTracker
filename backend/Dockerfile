FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Python
RUN apt-get update -y \
&& apt-get install -y --no-install-recommends python-wheel=0.29.0-2 python-setuptools=33.1.1-1 python-pip=9.0.1-2+deb9u1 python-dev=2.7.13-2 build-essential=12.3 \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app
RUN pip install -r ./airbnb_microservice/requirements.txt
ENTRYPOINT ["python"]
CMD ["./airbnb_microservice/service.py", "--host", "0.0.0.0"]

EXPOSE 3000
