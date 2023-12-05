/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0]; // Get the target server from the arguments
    const maxActiveScripts = ns.args[1]; // Get the max number of active scripts allowed

    if (!target) {
        ns.tprint("Error: No target specified.");
        return;
    }

    if (!target || isNaN(maxActiveScripts)) {
        ns.tprint("Error: Invalid arguments. Usage: run worm.js [target] [maxActiveScripts]");
        return;
    }

    const mainScript = 'jackv4.js';
    const supportingScripts = ['hack.js', 'grow.js', 'weaken.js'];
    // Add this to the filter if you want to exclude servers you've already purchased as well as the home server and moneyless servers
    // const purchasedServers = ns.getPurchasedServers();
    // && server !== 'avmnite-02h' && server !== 'CSEC' && server !== 'I.I.I.I' && !purchasedServers.includes(server)
    const targetServers = getAllServers(ns).filter(server => server !== 'home');


    for (const server of targetServers) {
        if (!ns.hasRootAccess(server) && canNuke(ns, server)) {
            tryNuke(ns, server);
        }
        if (ns.hasRootAccess(server) && canHack(ns, server)) {
            const success = await deployScripts(ns, server, [mainScript, ...supportingScripts], mainScript, target, parseInt(maxActiveScripts));
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

async function deployScripts(ns, server, scripts, mainScript, target, maxActiveScripts) {
    for (const script of scripts) {
        const success = await ns.scp(script, server);
        if (!success) {
            ns.tprint(`Failed to copy ${script} to ${server}`);
            return false;
        }
    }

    if (typeof maxActiveScripts !== 'number') {
        ns.tprint(`Error: maxActiveScripts is not a number. It is: ${typeof maxActiveScripts}`);
        return false;
    }

    ns.tprint(`Executing ${mainScript} on ${server} with args: ${target}, ${maxActiveScripts}`);
    const pid = ns.exec(mainScript, server, 1, target, maxActiveScripts);
    return pid !== 0;
}

