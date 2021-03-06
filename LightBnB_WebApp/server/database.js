const { Pool } = require('pg');

const properties = require('./json/properties.json');
const users = require('./json/users.json');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
})

/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`
      SELECT * FROM users
      WHERE email = '${email}'
    `).then(res => res.rows[0])
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`
    SELECT * FROM users
    WHERE id = ${id}
    `).then(res => res.rows[0])
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  console.log("I am running")
  // console.log(user)
  return pool
    .query(`
    INSERT INTO users(name, email, password)
    VALUES($1, $2, $3)
    RETURNING *
    `, [user.name, user.email, user.password]).then(res => {
      return res.rows[0]
    }).catch(err => console.log(err));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
    SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT 10;
    `, [guest_id])
    .then(res => {
      return res.rows
    })

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {
  const city = options.city
  const minPrice = options.minimum_price_per_night;
  const maxPrice = options.maximum_price_per_night;
  const rating = options.minimum_rating;
  const ownerID = options.owner_id;

  const queryParams = [];
  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;
  if (ownerID) {
    queryParams.push(ownerID)
    queryString += `WHERE owner_id = $${queryParams.length}`
  }

  if (city) {
    queryParams.push(`%${city}%`)
    queryString += `WHERE CITY LIKE $${queryParams.length}`
  }
  if (minPrice) {
    queryParams.push(minPrice * 100)
    queryString += ` AND cost_per_night > $${queryParams.length}`
  }
  if (maxPrice) {
    queryParams.push(maxPrice * 100)
    queryString += ` AND cost_per_night < $${queryParams.length}`
  }
  queryString += `
  GROUP BY properties.id
  `
  if (rating) {
    queryParams.push(rating)
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`
  }
  queryString += `
  ORDER BY cost_per_night
  LIMIT ${limit};
  `
  return pool.query(queryString, queryParams).then((res) => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const { title,
    description,
    number_of_bedrooms,
    number_of_bathrooms,
    parking_spaces,
    cost_per_night,
    thumbnail_photo_url,
    cover_photo_url,
    street,
    country,
    city,
    province,
    post_code,
    owner_id } = property

  return pool
    .query(`
  INSERT INTO properties(owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, 
    number_of_bedrooms, country, street, city, province, post_code)
  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *
  `, [
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms,
      country,
      street,
      city,
      province,
      post_code
    ])
    .then(res => {
      console.log(res.rows[0])
      return res.rows[0]
    })
}
exports.addProperty = addProperty;
