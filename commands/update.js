async function handleSyncupUpdates({ command, ack, say }) {
    // acknowledge command
    await ack()
    await say(`Hey There! <@${command.user_name}>! I will help you provide daily sync-up updates!`);
}
module.exports = { handleSyncupUpdates }