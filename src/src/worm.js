export async function main(ns) {
    const portNumber = ns.args[0] || 1;  // Default to port 1 if not provided
    ns.clearPort(portNumber); // Clear port data
    let servers = getAllServers(ns, 'home');
    let scripts = ['/src/scripts/hack.js', '/src/scripts/weaken.js', '/src/scripts/grow.js', '/src/bm.js'];

    while (true) {
        await checkAndCopyScripts(ns, servers, scripts);
        await ns.sleep(10000); // Wait 10 seconds before looping
    }
}

async function checkAndCopyScripts(ns, servers, scripts) {
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];

        // Attempt to open all possible ports on the server
        await attemptPortOpening(ns, server);

        // For each server we have access to, copy each script if not present already
        if (ns.hasRootAccess(server)) {
            let copiedScripts = false;
            for (let script of scripts) {
                if (!ns.fileExists(script, server)) {
                    await ns.scp(`${script}`, server);
                    copiedScripts = true;
                }
            }
            if (copiedScripts) {
                ns.tprint(`INFO: Scripts copied to server ${server}`);
                copiedScripts = false;
            }
        }
    }
}

async function attemptPortOpening(ns, server) {
    let openPorts = 0;

    // Attempt to open each port regardless of root access status
    if (ns.fileExists("bruteSSH.exe", "home")) {
        ns.brutessh(server);
        openPorts++;
    }
    if (ns.fileExists("ftpcrack.exe", "home")) {
        ns.ftpcrack(server);
        openPorts++;
    }
    if (ns.fileExists("sqlinject.exe", "home")) {
        ns.sqlinject(server);
        openPorts++;
    }
    if (ns.fileExists("httpworm.exe", "home")) {
        ns.httpworm(server);
        openPorts++;
    }
    if (ns.fileExists("relaysmtp.exe", "home")) {
        ns.relaysmtp(server);
        openPorts++;
    }

    const portsRequired = ns.getServerNumPortsRequired(server);

    if (portsRequired <= openPorts && !ns.hasRootAccess(server)) {
        await ns.nuke(server);
        ns.tprint(`SUCCESS: Gained root access to: ${server}`);
    }

    ns.print(`Opened ${openPorts} ports on server ${server}`);
}

function getAllServers(ns, startServer) {
    const portNumber = ns.args[0] || 1;  // Default to port 1 if not provided
    let servers = new Set([startServer]);
    let visited = {startServer: true};
    let i = 0;

    while (i < Array.from(servers).length) {
        let nextServer = Array.from(servers)[i];
        let newServers = ns.scan(nextServer);

        for (let newServer of newServers) {
            if (!visited[newServer]) {
                servers.add(newServer);
                visited[newServer] = true;
            }
        }

        i++;
    }

    for (let server of Array.from(servers)) {
        let allServers = ns.readPort(portNumber).split(',');
        if (!allServers.includes(server)) {
            ns.writePort(portNumber, allServers.concat(server).join(','));
        }
    }
    ns.writePort(portNumber, "NULL");

    return Array.from(servers);
}
