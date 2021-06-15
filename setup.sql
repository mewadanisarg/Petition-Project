

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profile CASCADE;
-- this is how to write a comments in an SQL file...

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR NOT NULL CHECK(first_name != ''),
    last_name VARCHAR NOT NULL CHECK(last_name != ''),
    email VARCHAR NOT NULL UNIQUE CHECK(email != ''),
    hash_password VARCHAR NOT NULL CHECK (hash_password != ''),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profile(
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR(50),
    url VARCHAR(300),
    user_id INT REFERENCES users(id) NOT NULL UNIQUE	
);

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    --first_name VARCHAR NOT NULL CHECK(first_name != ''),
    --last_name VARCHAR NOT NULL CHECK(last_name != ''),
    signature VARCHAR NOT NULL CHECK(signature != ''),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
