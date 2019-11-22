const db = require("./dbs");

class UserService {
    addFavourite(userId, airbnbId) {
      return db.addFavourite(userId, airbnbId);
    }

    deleteFavourite(userId, airbnbId) {
      return db.deleteFavourite(userId, airbnbId);
    }

    getFavourites(userId) {
      return db.getFavourites(userId);
    }
}

var userService = new UserService();
module.exports = userService;
