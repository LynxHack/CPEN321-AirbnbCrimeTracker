from flask import Flask, jsonify, request
import airbnb
from datetime import date

## Setup
app = Flask(__name__)
api = airbnb.Api()
port = 5000

## Route
@app.route('/')
def home():
    return "This is airbnb querying microservice"

@app.route('/airbnb')
def search():
    location  = request.args.get('location', None)
    startdate  = request.args.get('startdate', None)
    enddate  = request.args.get('enddate', None)
    numlistings = 50
    result = api.get_homes(location, items_per_grid = numlistings, checkin=startdate, checkout=enddate)
    return jsonify(result)

## Init
if __name__ == '__main__':
    app.run(port=port, host='localhost')
