const express = require('express');
const { App } = require('@slack/bolt');
const cors = require('cors');
require('dotenv').config()
const authRouter = require('./routes/oauth'); // Import the auth routes

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware for parsing form data
app.use(cors());

//Middleware for authorization check
const { authorizationMiddleware } = require('./middleware/isAuthorized')
const { handleSyncupUpdates } = require('./commands/update')
const { handleLocationCommand } = require('./commands/location')

let client = null;



(async () => {
    if (client) {
        console.log('Already initialized!')
        return
    }
    const slackApp = initClient();
    const port = process.env.PORT || 3000
    await slackApp.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running! on port' + port);
})()

function initClient() {
    client = new App({
        token: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        socketMode: true,
        appToken: process.env.SLACK_APP_TOKEN
    });

    return client
}
app.use('/slack', authRouter); // Mount the auth router

client.use(authorizationMiddleware);

client.command('/updates', handleSyncupUpdates);
client.command('/location', handleLocationCommand)

// Static route to render the "Add to Slack" button
app.get('/', (req, res) => {
    res.render('index', {
        slackClientId: process.env.SLACK_CLIENT_ID,
        redirectUri: process.env.REDIRECT_URI // This should be your Ngrok URL or production URL
    });
});


app.listen(4000, () => {
    console.log('Server is running!');
});