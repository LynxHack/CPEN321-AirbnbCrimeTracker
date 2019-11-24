var userService = require("../UserService");
const db = require("../dbs");
jest.mock("../dbs");

describe('Testing addFavourite(userId, airbnbId)', () => {
  db.addFavourite.mockReturnValue("Response from db");
  it('test addFavourite', () => {
    expect(userService.addFavourite(1,2)).toBe("Response from db");
  });
})

describe('Testing deleteFavourite(userId, airbnbId)', () => {
  db.deleteFavourite.mockReturnValue("Response from db");
  it('test deleteFavourite', () => {
    expect(userService.deleteFavourite(1,2)).toBe("Response from db");
  });
})

describe('Testing getFavourites(userId, airbnbId)', () => {
  db.getFavourites.mockReturnValue("Response from db");
  it('test getFavourite', () => {
    expect(userService.getFavourites(1)).toBe("Response from db");
  });
})
