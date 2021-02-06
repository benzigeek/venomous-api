# venomous-api

Venomous is an opensource game streaming platform simular to twitch.

**NOTE Venomous project is currently under development and does not fully work yet**

If you'd like to donate to help the devlopemnt of Venomous, you can do so using my [ko-fi](https://ko-fi.com/benzigeek)

![venomous](https://i.imgur.com/gV2kos7.jpg)

# Other Repo's

venomous uses multiple applications to fully work so you'll need the other repos

* [RESTful API](https://github.com/watch-venomous/venomous-api)
* Web Client (Not Public Yet)
* Websocket Server (Not Public Yet)
* Digest Server (Not Public Yet)
* Mobile App (Not Public Yet)

# Development

To run this application in development mode you'll need to make sure to configure everything correctly.

### Installation

you'll need to be able to build c++ binary's to install everything correctly. you'll need to install [node-gyp](https://github.com/nodejs/node-gyp).

Once you have node-gyp installed you will then be able to run `npm install` in a terminal

### Configuration

you'll need to set a few environment variables.

1. `MONGO_URI`: your mongodb connection url
2. `EMAIL_PASSWORD`: The email password, for sending verifaction emails.
3. `PHONE_SID`: The account SID for twilio
4. `PHONE_TOKEN`: The Auth token for twilio

you'll also need to set some stuff in the `/config/default.json` file

1. `port`: The port you'd like to run the application on
2. `emailusername`: The username to login to the smtp mail server
3. `phone`: Your twilio phone number`

### Running

To start the application in devlopment mode you'll have to run `npm run dev` in a terminal
