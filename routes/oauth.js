const express = require('express');
const axios = require('axios');
const sdk = require("node-appwrite");
const { Databases } = require('node-appwrite')
const router = express.Router();
const appwriteSdk = new sdk.Client();

appwriteSdk
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject(process.env.PROJECT_ID)
    .setKey(process.env.API_KEY);

const databases = new Databases(appwriteSdk)
// Route to handle the OAuth flow
router.get('/install', (req, res) => {
    console.log("INSTALL******", req)
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = `${process.env.REDIRECT_URI}/callback`; // Ensure this matches your registered redirect URI
    console.log("Redirecting to Slack OAuth...");

    // Redirect to Slack's OAuth authorization page
    res.redirect(`https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write,channels:read&redirect_uri=${encodeURIComponent(redirectUri)}`);
});

// Route to handle the callback from Slack after authorization
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No code received');
    }

    try {
        // Exchange the code for an access token
        console.log("Exchanging code***")
        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: `${process.env.REDIRECT_URI}/callback`
            }
        });

        const { access_token, team, authed_user, token_type, scope } = response.data;
        console.log('RESPNSE*****', response.data)
        if (!access_token) {
            return res.status(400).send('Failed to get access token');
        }

        // Store the access token in Appwrite
        const databaseId = process.env.DATABASE_ID; // Replace with your Appwrite database ID
        const documentId = authed_user.id; 
        const data = {
            access_token: access_token,
            user_id: authed_user.id,
            workspace_id: team.id, // Save the workspace ID
            token_type: token_type,
            scope: scope
        };

        await databases.createDocument(databaseId, process.env.TOKENS_COLLECTION_ID, documentId, data);
        console.log('Access token saved:', data);

        // Respond with a success message
        res.send(`App installed to team ${team.name}!`);
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).send('Error during OAuth process');
    }
});

module.exports = router;
