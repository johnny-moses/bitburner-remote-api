export async function main(ns) {
    const homeServer = 'home';
    const ramBuffer = 1.25; // Reserve 2.5GB of RAM

    let targetServers = scanAllServers(ns);
    let rootServers = getRootServers(ns, targetServers);
    let eligibleServersList = eligibleServers(ns, targetServers).slice(0, 3); // Top 3 servers

    ns.tprint(`Starting advanced attack script from home server: ${homeServer}`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(1000);
        for (let target of eligibleServersList) {
            for (let source of rootServers) {
                await ns.sleep(5000);
                let action;
                const currentSecurity = ns.getServerSecurityLevel(target.name);
                const currentMoney = ns.getServerMoneyAvailable(target.name);
                const maxMoney = ns.getServerMaxMoney(target.name);
                const securityThreshold = ns.getServerMinSecurityLevel(target.name) + 10;
                const moneyThreshold = 0.90;

                if (currentSecurity > securityThreshold) {
                    action = 'weaken';
                } else if (currentMoney < maxMoney * moneyThreshold) {
                    action = 'grow';
                } else {
                    action = 'hack';
                }
                const scriptRam = ns.getScriptRam(`wormy/simple/scripts/${action}.js`, homeServer);
                if (scriptRam <= 0) {
                    ns.tprint(`Error: Script RAM usage is zero or invalid for ${action}.js on home server ${homeServer}`);
                    return;
                }
                let availableRam = ns.getServerMaxRam(source) - ns.getServerUsedRam(source) - ramBuffer;
                while (availableRam >= scriptRam) {
                    ns.scp(`wormy/simple/scripts/${action}.js`, homeServer, source);
                    const pid = ns.exec(`wormy/simple/scripts/${action}.js`, source, 1, target.name);
                    if (pid === 0) {
                        break;
                    } else {
                        availableRam -= scriptRam;
                    }
                    await ns.sleep(100);
                }
            }
        }
        targetServers = scanAllServers(ns);
        rootServers = getRootServers(ns, targetServers);
        eligibleServersList = eligibleServers(ns, targetServers).slice(0, 3);
    }
}


// This function scans for all servers & returns the list
function scanAllServers(ns) {
    let servers = ['home'];

    for (let i = 0; i < servers.length; ++i) {
        let newServers = ns.scan(servers[i]);
        for (let newServer of newServers) {
            if (!servers.includes(newServer)) {
                servers.push(newServer);
            }
        }
    }
    return servers;
}

// Function checks for all servers that you have root access to
function getRootServers(ns, servers) {
    let rootServers = [];

    for (let server of servers) {
        if (ns.hasRootAccess(server)) {
            rootServers.push(server);
        }
    }

    return rootServers;
}

// Function to check which servers are hackable
function eligibleServers(ns, servers) {
    let hackableServers = [];

    for (let i = 0; i < servers.length; ++i) {
        let server = servers[i];
        if (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()) {
            hackableServers.push({
                name: server,
                money: ns.getServerMoneyAvailable(server),
            });
        }
    }
    hackableServers.sort((a, b) => b.money - a.money); // Sort in descending order of money
    return hackableServers;
}