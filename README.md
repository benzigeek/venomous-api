# venomous-api
This project is currently under development and does not fully work yet

![venomous](https://i.imgur.com/gV2kos7.jpg)

# Development

To run this application in development mode you'll need to make sure to configure everything correctly.

### Installation

you'll need to be able to build c++ binary's to install everything correctly. you'll need to install [node-gyp](https://github.com/nodejs/node-gyp).

Once you have node-gyp installed you will then be able to run `npm install` in a terminal

### Configuration

you'll need to set a few environment variables.

1. `MONGO_URI`: you're mongodb connection url
2. `EMAIL_PASSWORD`: The email password, for sending verifaction emails.

### Running

To start the application in devlopment mode you'll have to run `npm run dev` in a terminal
