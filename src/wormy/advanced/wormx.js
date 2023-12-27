/** @param {NS} ns **/
export async function main(ns) {
    const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
    const filesToCopy = ["wormy/advanced/scripts/hack.js", "wormy/advanced/scripts/grow.js", "wormy/advanced/scripts/weaken.js"]; // Add the names of your files here
    let serversScanned = [];

    async function scanAndRoot(server) {
        // Avoid re-scanning the same server
        if (serversScanned.includes(server)) {
            return;
        }
        serversScanned.push(server);

        // Open ports if possible
        if (ns.fileExists(programs[0], "home")) ns.brutessh(server);
        if (ns.fileExists(programs[1], "home")) ns.ftpcrack(server);
        if (ns.fileExists(programs[2], "home")) ns.relaysmtp(server);
        if (ns.fileExists(programs[3], "home")) ns.httpworm(server);
        if (ns.fileExists(programs[4], "home")) ns.sqlinject(server);

        // Nuke the server if we have enough ports open
        if (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() && ns.getServerNumPortsRequired(server) <= ns.getServer().openPortCount) {
            ns.nuke(server);
            ns.tprint(`Gained root access to ${server}`);

            // Copy files to the server
            if (ns.hasRootAccess(server)) {
                await ns.scp(filesToCopy, "home", server);
                ns.tprint(`Copied files to ${server}`);
            }
        }

        // Recursively scan for more servers
        let connectedServers = ns.scan(server);
        for (let i = 0; i < connectedServers.length; i++) {
            await scanAndRoot(connectedServers[i]);
        }
    }

    await scanAndRoot("home");
}
