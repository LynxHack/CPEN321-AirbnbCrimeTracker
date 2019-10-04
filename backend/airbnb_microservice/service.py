from flask import Flask, request, jsonify
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
    result = api.get_homes(location)
    return jsonify(result)

## Init
if __name__ == '__main__':
    app.run(port=port, debug=True, host='0.0.0.0')
