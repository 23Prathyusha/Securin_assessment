-- schema.sql
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    cuisine VARCHAR,
    title VARCHAR,
    rating FLOAT,
    prep_time INT,
    cook_time INT,
    total_time INT,
    description TEXT,
    nutrients JSONB,
    serves VARCHAR
);


