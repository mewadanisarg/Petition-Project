const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL || "postgres:web:postgres@localhost:5432/petition"
);

module.exports.userRegisteration = (
    first_name,
    last_name,
    email,
    hash_password
) => {
    console.log(
        "Inside module.export.userRegistration",
        first_name,
        last_name,
        email,
        hash_password
    );
    const q = `
    INSERT INTO users (first_name, last_name, email, hash_password) 
    VALUES($1, $2, $3, $4)
    RETURNING id`;
    const params = [first_name, last_name, email, hash_password];
    return db.query(q, params);
};
module.exports.finduser = (email) => {
    console.log("module.exports.findusern email", email);
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

module.exports.addProfile = (user_id, age, city, url) => {
    console.log("module.exports.addprofile:", user_id, age, city, url);
    const q = `
        INSERT INTO user_profile (user_id, age, city, url)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;
    const params = [user_id, age, city, url];
    return db.query(q, params);
};

module.exports.getUserInfoForEdit = (userId) => {
    console.log("Inside module.exports.getUserInfoForEdit", userId);
    const q = `SELECT first_name, last_name, email, hash_password, age, city, url FROM users LEFT JOIN user_profile ON user_profile.user_id = users.id WHERE users.id = $1`;
    const params = [userId];
    return db.query(q, params);
};
module.exports.updateUserInfo = (first_name, last_name, email, user_id) => {
    console.log(
        "Inside module.exports.updateUsersInfo",
        first_name,
        last_name,
        email,
        user_id
    );
    const q = `UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4`;
    const params = [first_name, last_name, email, user_id];
    return db.query(q, params);
};

module.exports.updateUserPassword = (hash_password, user_id) => {
    console.log(
        "Inside module.exports.updateUserPassword",
        hash_password,
        user_id
    );
    const q = `UPDATE users SET hash_password = $1 WHERE id = $2`;
    const params = [hash_password, user_id];
    return db.query(q, params);
};
module.exports.updateUserProfile = (age, city, url, user_id) => {
    console.log(
        "Inside module.exports.updateUserProfile",
        age,
        city,
        url,
        user_id
    );
    const q = `INSERT INTO user_profile (age, city, url, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET age = $1, city = $2, url = $3`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

module.exports.addSignature = (user_id, signature) => {
    console.log("Inside module.export.signature", user_id, signature);
    // WE NEED TO PREVENT AN SQL INJECTION
    // WE DO IT WITH PARAMS
    const q = `
        INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2)
        RETURNING id
    `;
    const params = [user_id, signature];
    return db.query(q, params);
};

module.exports.deleteUserSignature = (userId) => {
    console.log("module.exports.deleteSignature", userId);
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [userId]);
};

module.exports.getSignature = (userId) => {
    console.log("Inside module.exports.getSignature", userId);
    return db.query(
        `
        SELECT signature FROM signatures
        WHERE user_id =$1
    `,
        [userId]
    );
};

module.exports.getFirstAndLastNames = () => {
    return db.query(
        // "SELECT first_name, last_name FROM signatures"
        `
        SELECT first_name, last_name, age, city, url FROM user_profile
        JOIN users ON user_profile.user_id = users.id
        JOIN signatures ON signatures.user_id = users.id`
    );
};

module.exports.getUsersByCity = (city) => {
    console.log("module.exports.getNamebyCity:", city);
    return db.query(
        `SELECT first_name, last_name, age, city, url FROM user_profile
        JOIN users ON user_profile.user_id = users.id
        JOIN signatures ON signatures.user_id = users.id
        WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
};
