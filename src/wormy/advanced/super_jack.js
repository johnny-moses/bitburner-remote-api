/** @param {NS} ns **/
export async function main(ns) {
    const homeServer = 'home';
    const ramBuffer = 0.50; // Reserve 0.50GB of RAM

    // Pass the target server from the arguments
    let targetServer = ns.args[0];
    if (!targetServer) {
        ns.tprint('WARN No target server provided');
        return;
    }

    ns.tprint(`SUCCESS: Starting advanced attack script on target server: ${targetServer}`);

    const rootServers = getRootServers(ns);
    rootServers.push(homeServer);

    // Try nuking the targetServer to gain root access
    tryNuke(ns, targetServer);

    // eslint-disable-next-line no-constant-condition
    const formulas = ns.formulas.hacking;

    while (true) {
        await ns.sleep(100);
        for (let source of rootServers) {
            await ns.sleep(100);
            let action, threads, scriptPath;
            const player = ns.getPlayer();
            const server = ns.getServer(targetServer);
            const maxRam = ns.getServerMaxRam(source);
            const usedRam = ns.getServerUsedRam(source);
            const availableRam = maxRam - usedRam;
            const currentSecurity = ns.getServerSecurityLevel(targetServer);
            const currentMoney = ns.getServerMoneyAvailable(targetServer);
            const maxMoney = ns.getServerMaxMoney(targetServer);
            const securityThreshold = ns.getServerMinSecurityLevel(targetServer) + 10;
            const moneyThreshold = 0.90;

            if (currentSecurity > securityThreshold) {
                action = 'weaken';
                threads = calculateWeakenThreads(ns, targetServer);
                scriptPath = 'wormy/advanced/scripts/weaken.js';
            } else if (currentMoney < maxMoney * moneyThreshold) {
                action = 'grow';
                threads = calculateGrowThreads(ns, targetServer);
                scriptPath = 'wormy/advanced/scripts/grow.js';
            } else {
                action = 'hack';
                threads = 1;  // for hack we'll run single thread as its impact is linear
                scriptPath = 'wormy/advanced/scripts/hack.js';
            }

            const cores = availableRam / ns.getScriptRam(scriptPath, homeServer);

            const scriptRam = ns.getScriptRam(scriptPath, homeServer);
            if (scriptRam <= 0) {
                ns.print(`ERROR: Script RAM usage is zero or invalid for ${scriptPath} on home server ${homeServer}`);
                return;
            }

            if ((threads * scriptRam) > availableRam) {
                ns.print(`WARN: Not enough RAM available on ${source} for ${scriptPath} with ${threads} threads.`);
                continue;

            }

            ns.scp(scriptPath, source);
            ns.exec(scriptPath, source, threads, targetServer);
        }
    }
}

// Function checks for all servers that you have root access to
function getRootServers(ns, startServer = 'home') {
    let visitedServers = [];
    let serversToVisit = [startServer];

    while (serversToVisit.length > 0) {
        let currentServer = serversToVisit.pop();

        if (!visitedServers.includes(currentServer)) {
            visitedServers.push(currentServer);

            let connectedServers = ns.scan(currentServer);
            for (let server of connectedServers) {
                if (ns.hasRootAccess(server)) {
                    serversToVisit.push(server);
                }
            }
        }
    }

    return visitedServers;
}

function tryNuke(ns, server) {
    if (ns.fileExists('BruteSSH.exe', 'home')) ns.brutessh(server);
    if (ns.fileExists('FTPCrack.exe', 'home')) ns.ftpcrack(server);
    if (ns.fileExists('relaySMTP.exe', 'home')) ns.relaysmtp(server);
    if (ns.fileExists('HTTPWorm.exe', 'home')) ns.httpworm(server);
    if (ns.fileExists('SQLInject.exe', 'home')) ns.sqlinject(server);

    if (ns.getServerNumPortsRequired(server) <= 5) {
        ns.nuke(server);
    }
}

// Weaken threads calculation function
function calculateWeakenThreads(ns, server) {
    const oldSecurity = ns.getServerSecurityLevel(server);
    const newSecurity = ns.getServerMinSecurityLevel(server) + 10;
    const amountWeakened = ns.weakenAnalyze(1);
    const threads = Math.ceil((oldSecurity - newSecurity) / amountWeakened);
    return Math.max(1, threads); // at least 1 thread
}

// Grow threads calculation function
function calculateGrowThreads(ns, server) {
    const oldMoney = ns.getServerMoneyAvailable(server);
    const newMoney = ns.getServerMaxMoney(server);
    const growthPercentage = ns.getServerGrowth(server) / 100;
    const threads = Math.ceil(Math.log(newMoney / oldMoney) / Math.log(1 + growthPercentage));
    return Math.max(1, threads); // at least 1 thread s
}