# Choredos
A web app to monitor repetitive chores.

## Getting Started

### Project Overview
Project uses `express: ^4.19.2` framework with `ejs: ^3.1.10` for views. Uses `mongodb: ^6.8.0` with `mongoose: ^8.5.4` ODM.

### Prerequisites

Should have [Node.js](https://nodejs.org/en/download/prebuilt-installer) installed.

Run the following command to install dependencies:

```shell
npm install
```

You must create your own [MongoDB](https://www.mongodb.com/) to set your unique environment variables.

### Environment variables

This project depends on some environment variables.
If you are running this project locally, create a `nodemon.json` file at the root for these variables.
Your host provider should include a feature to set them there directly to avoid exposing them.

Here are the required ones:

```
{
  "env": {
    "MONGO_USER": "YOUR_MONGODB_USERNAME",
    "MONGO_PASSWORD": "YOUR_MONGODB_PASSWORD",
    "MONGO_DB": "YOUR_MONGODB_COLLECTION",
    "SESSION_SECRET": "YOUR_SESSION_SECRET_CAN_BE_WHATEVER",
    "CSRF_SECRET": "YOUR_CSRF_SECRET_CAN_BE_WHATEVER",
  }
}
```

### Run the project

Run the following command to run the project:

```shell
npm start
```
