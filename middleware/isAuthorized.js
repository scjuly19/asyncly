const sdk = require("node-appwrite");

// Initialize the Appwrite SDK
const appwriteSdk = new sdk.Client();
const database = new sdk.Databases(appwriteSdk);

appwriteSdk
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject(process.env.PROJECT_ID)
    .setKey(process.env.API_KEY);

const tokenCollectionId = process.env.TOKENS_COLLECTION_ID;

// Function to check if the user is authorized
async function isAuthorized(workspaceId) {
    try {
        const response = await database.listDocuments(
            process.env.DATABASE_ID,
            tokenCollectionId,
            [
               sdk.Query.equal('workspace_id', workspaceId)
            ]
        );
        return response.total > 0;
    } catch (error) {
        console.error('Error checking authorization:', error);
        return false;
    }
}

// Middleware to check authorization for all commands
async function authorizationMiddleware({ command, ack, next, respond }) {
    await ack(); // Acknowledge the command

    const isUserAuthorized = await isAuthorized(command.team_id);
    if (!isUserAuthorized) {
        await respond("You are not authorized to use this app. Please install the app first.");
        return;
    }
    console.log('Authorized! Move to next!')
    // If authorized, move to the next handler
    await next();
}
module.exports = { authorizationMiddleware }
