// Description: This script will attempt to hack all servers in the game by using the 'worm' strategy.
// The worm strategy is to first nuke a server, then deploy a script that will automatically launch grow/weaken/hack scripts as needed.
// Copies jack.js and supporting scripts to all servers that are connected to the target server, then executes jack.js on each server.
// Usage: run worm.js [target]

/** @param {NS} ns **/
export async function main(ns) {

    const mainScript = 'wormy/advanced/jackx.js';
    const supportingScripts = ['wormy/advanced/scripts/hack.js', 'wormy/advanced/scripts/grow.js', 'wormy/advanced/scripts/weaken.js'];
    // Add this to the filter if you want to exclude servers you've already purchased as well as the home server and moneyless servers
    // const purchasedServers = ns.getPurchasedServers();
    // && server !== 'avmnite-02h' && server !== 'CSEC' && server !== 'I.I.I.I' && !purchasedServers.includes(server)
    // .filter(server => server !== 'home'
    const targetServers = getAllServers(ns);
    const topServers = getTopServers(ns, 5);

    for (const server of targetServers) {
        if (!ns.hasRootAccess(server) && canNuke(ns, server)) {
            tryNuke(ns, server);
        }
        if (ns.hasRootAccess(server) && canHack(ns, server)) {
            // In the deployScripts function in wormx.js
            const topServersList = topServers.join(","); // Convert array to a comma-separated string
            const success = await deployScripts(ns, server, [mainScript, ...supportingScripts], mainScript, topServersList);

            if (!success) {
                ns.tprint(`Failed to deploy on server: ${server}`);
            }
            await ns.sleep(100); // Adding a slight delay to reduce load
        }
    }
}

function getAllServers(ns, server = 'home', seenServers = new Set()) {
    if (seenServers.has(server)) return [];
    seenServers.add(server);

    const connectedServers = ns.scan(server);
    let servers = [server];

    for (const connectedServer of connectedServers) {
        servers = servers.concat(getAllServers(ns, connectedServer, seenServers));
    }

    return servers;
}

function getTopServers(ns, number) {
    let allServers = getAllServers(ns);
    let hackableServers = allServers.filter(server =>
        ns.hasRootAccess(server) &&
        ns.getServerMaxMoney(server) > 0 &&
        ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()
    );

    // Sort servers by their maximum money in descending order
    hackableServers.sort((a, b) => ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a));

    // Return the top 'number' servers
    return hackableServers.slice(0, number);
}


function canHack(ns, server) {
    return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server);
}

function canNuke(ns, server) {
    let portsRequired = ns.getServerNumPortsRequired(server);
    let portsOpened = 0;

    if (ns.fileExists('BruteSSH.exe', 'home')) portsOpened++;
    if (ns.fileExists('FTPCrack.exe', 'home')) portsOpened++;
    if (ns.fileExists('relaySMTP.exe', 'home')) portsOpened++;
    if (ns.fileExists('HTTPWorm.exe', 'home')) portsOpened++;
    if (ns.fileExists('SQLInject.exe', 'home')) portsOpened++;

    return portsOpened >= portsRequired;
}

function tryNuke(ns, server) {
    if (ns.fileExists('BruteSSH.exe', 'home')) ns.brutessh(server);
    if (ns.fileExists('FTPCrack.exe', 'home')) ns.ftpcrack(server);
    if (ns.fileExists('relaySMTP.exe', 'home')) ns.relaysmtp(server);
    if (ns.fileExists('HTTPWorm.exe', 'home')) ns.httpworm(server);
    if (ns.fileExists('SQLInject.exe', 'home')) ns.sqlinject(server);

    if (canNuke(ns, server)) {
        ns.nuke(server);
    }
}

async function deployScripts(ns, server, scripts, mainScript, targets) {

    for (const script of scripts) {
        const success = await ns.scp(script, server);
        if (!success) {
            return false; // If copying fails, return false
        }
    }
    // Ensure targets is an array and pass it to exec
    const args = Array.isArray(targets) ? targets : [targets];
    const pid = ns.exec(mainScript, server, 1, ...args); // Spread the args array
    return pid !== 0; // Return true if exec was successful, false otherwise
}