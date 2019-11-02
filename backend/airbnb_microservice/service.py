from flask import Flask, jsonify
import airbnb

## Setup
app = Flask(__name__)
api = airbnb.Api()
port = 5000

## Route
@app.route('/')
def home():
    return "This is airbnb querying microservice"

@app.route('/<location>')
def search(location):
    numlistings = 50
    result = api.get_homes(location, items_per_grid = numlistings)
    return jsonify(result)

## Init
if __name__ == '__main__':
    app.run(port=port, debug=True, host='0.0.0.0')
