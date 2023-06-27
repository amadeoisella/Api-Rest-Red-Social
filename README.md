# Api-Rest-Social-Network
Social Network Api Rest with Mongodb

This API-Rest provides basic functionality for a simple social network. It includes controllers for user registration and login, publication management, and following/follower relationships.

# User Controller

Register a User
URL: /api/register
Method: POST
Description: Register a new user with the provided information.

Request Body:

Parameter	Type	Required	Description
name	string	yes	User's name
email	string	yes	User's email
password	string	yes	User's password
nick	string	yes	User's nickname

Response:

HTTP Status	Response Body	Description
200	{ "status": "success", "message": "user successfully registered", "user": {...} }	User registration successful
400	{ "status": "error", "message": "no data to be sent" }	Missing required information
400	{ "status": "error", "message": "validation failed" }	Validation of input parameters failed
200	{ "status": "success", "message": "user already exists" }	User with the provided email/nickname already exists
500	{ "status": "error", "message": "Internal server error" }	Error occurred on the server side

# User Login
URL: /api/login
Method: POST
Description: Authenticate a user and retrieve a token for authorization.

Request Body:

Parameter	Type	Required	Description
email	string	yes	User's email
password	string	yes	User's password

Response:

HTTP Status	Response Body	Description
200	{ "status": "success", "message": "you are correctly identified", "user": {...}, "token": "..." }	User login successful with authentication token
404	{ "status": "error", "message": "nonexistent user" }	User with the provided email does not exist
400	{ "status": "error", "message": "you are not correctly identified" }	Incorrect password entered
404	{ "status": "error", "message": "no data to send" }	Missing required information
500	{ "status": "error", "message": "Internal server error" }	Error occurred on the server side

# User Profile
URL: /api/user/:id
Method: GET
Description: Retrieve the profile information of a user.

Request Parameters:

Parameter	Type	Required	Description
id	string	yes	User's ID

Response:

HTTP Status	Response Body	Description
200	{ "status": "success", "user": {...}, "following": true, "follower": false }	User profile retrieved successfully with following/follower information
404	{ "status": "error", "message": "User does not exist" }	

