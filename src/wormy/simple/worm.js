// Description: This script should attempt to hack all servers in the game by using the 'worm' strategy.
// The worm strategy is to first nuke a server, then deploy a script that will automatically launch grow/weaken/hack scripts as needed.
// Copies jack.js and supporting scripts to all servers that are connected to the target server, then executes jack.js on each server.
// Usage: run worm.js [target]

// ...

/** @param {NS} ns **/
export async function main(ns) {

    const mainScript = 'wormy/advanced/jackx.js';
    const supportingScripts = ['wormy/advanced/scripts/hack.js', 'wormy/advanced/scripts/grow.js', 'wormy/advanced/scripts/weaken.js'];

    let targetServers = getAllServers(ns);

// get servers with max money information
    let serversWithMoney = targetServers.map(server => ({
        server,
        money: ns.getServerMaxMoney(server)
    })).filter(serverInfo => canHack(ns, serverInfo.server)); // Filter servers that can be hacked

// sort in descending order of max money
    serversWithMoney.sort((a, b) => b.money - a.money);

// pick top 5
    serversWithMoney = serversWithMoney.slice(0, 5);

    const targets = serversWithMoney.map(serverInfo => serverInfo.server); // list of top 5 servers

    for (const serverInfo of serversWithMoney) {
        let server = serverInfo.server;
        if (!ns.hasRootAccess(server) && canNuke(ns, server)) {
            tryNuke(ns, server);
        }
        if (ns.hasRootAccess(server)) {
            const success = await deployScripts(ns, server, [mainScript, ...supportingScripts], mainScript, targets); // pass targets to deployScripts
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

async function deployScripts(ns, server, scripts, mainScript, targets) {

    for (const script of scripts) {
        const success = await ns.scp(script, server);
        if (!success) {
            return false; // If copying fails, return false
        }
    }
    // Ensure targets is an array and pass it to exec
    targets = Array.isArray(targets) ? targets : [targets];
    const pid = ns.exec(mainScript, server, 1, ...targets); // Spread the targets array
    return pid !== 0; // Return true if exec was successful, false otherwise
}