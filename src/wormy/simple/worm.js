// Description: This script should attempt to hack all servers in the game by using the 'worm' strategy.
// The worm strategy is to first nuke a server, then deploy a script that will automatically launch grow/weaken/hack scripts as needed.
// Copies jack.js and supporting scripts to all servers that are connected to the target server, then executes jack.js on each server.
// Usage: run worm.js [target] yay

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0]; // Get the target server from the arguments
    if (!target) {
        ns.tprint("Error: No target specified.");
        return;
    }

    const mainScript = 'wormy/simple/jack.js';
    const supportingScripts = ['wormy/simple/scripts/hack.js', 'wormy/simple/scripts/grow.js', 'wormy/simple/scripts/weaken.js'];
    // Add this to the filter if you want to exclude servers you've already purchased as well as the home server and moneyless servers
    // const purchasedServers = ns.getPurchasedServers();
    // && server !== 'avmnite-02h' && server !== 'CSEC' && server !== 'I.I.I.I' && !purchasedServers.includes(server)
    // ).filter(server => server !== 'home'
    const targetServers = getAllServers(ns);

    for (const server of targetServers) {
        if (!ns.hasRootAccess(server) && canNuke(ns, server)) {
            tryNuke(ns, server);
        }
        if (ns.hasRootAccess(server) && canHack(ns, server)) {
            const success = await deployScripts(ns, server, [mainScript, ...supportingScripts], mainScript, target);
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

async function deployScripts(ns, server, scripts, mainScript, target) {
    for (const script of scripts) {
        const success = await ns.scp(script, server);
        if (!success) {
            return false; // If copying fails, return false
        }
    }
    // Pass the target server as an argument when executing the mainScript
    const pid = ns.exec(mainScript, server, 1, target); // Adjust the thread count as needed
    return pid !== 0; // Return true if exec was successful, false otherwise
}