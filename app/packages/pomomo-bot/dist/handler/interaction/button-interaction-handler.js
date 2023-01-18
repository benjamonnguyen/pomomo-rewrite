import discordClient from "../../bot";
const handle = async (btnInteraction) => {
    const execute = discordClient.buttons.get(btnInteraction.customId);
    if (!execute) {
        console.error(`Error: Button not registered: ${btnInteraction.customId}`);
        return;
    }
    await execute(btnInteraction);
};
export default handle;
//# sourceMappingURL=button-interaction-handler.js.map