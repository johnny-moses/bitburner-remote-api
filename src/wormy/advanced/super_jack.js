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
        // Default to 5 seconds if no scripts are running
        let maxRunTime = 5000;
        for (let source of rootServers) {
            const scriptsRunning = ns.ps(source);
            for (let script of scriptsRunning) {
                // Validate timeRunning before using it
                if (script.timeRunning && !isNaN(script.timeRunning)) {
                    maxRunTime = Math.max(maxRunTime, script.timeRunning);
                }
            }
        }
        // Wait for max running time plus a bit buffer if scripts are running
        if (maxRunTime > 5000) {
            await ns.sleep((maxRunTime * 1000) + 100);
        } else {
            // If no scripts are running, just sleep for the default interval
            await ns.sleep(100);
        }

        for (let source of rootServers) {
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
            } else if ((currentMoney / maxMoney) < moneyThreshold) {
                action = 'grow';
                threads = calculateGrowThreads(ns, targetServer, 2); // 2x server's money
                scriptPath = 'wormy/advanced/scripts/grow.js';
            } else {
                action = 'hack';
                threads = calculateHackThreads(ns, targetServer, 0.5);  // hack 50% of the money
                scriptPath = 'wormy/advanced/scripts/hack.js';
            }

            const scriptRam = ns.getScriptRam(scriptPath, homeServer);
            if (scriptRam <= 0) {
                ns.print(`WARN: Script RAM usage is zero or invalid for ${scriptPath} on home server ${homeServer}`);
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
function calculateWeakenThreads(ns, targetServer) {
    const oldSecurity = ns.getServerSecurityLevel(targetServer);
    const securityThreshold = ns.getServerMinSecurityLevel(targetServer) + 10;
    const weakenEffect = ns.weakenAnalyze(1);
    return Math.ceil((oldSecurity - securityThreshold) / weakenEffect);
}

// Grow threads calculation function
function calculateGrowThreads(ns, targetServer, desiredMultiplier) {
    // Use growthAnalyze to calculate required threads for achieving the desired multiplier
    return Math.ceil(ns.growthAnalyze(targetServer, desiredMultiplier));
}

function calculateHackThreads(ns, targetServer, availablePercentage) {
    const maxMoney = ns.getServerMaxMoney(targetServer);
    const hackAmount = maxMoney * availablePercentage; // percentage of maxMoney you want to hack
    return Math.ceil(ns.hackAnalyzeThreads(targetServer, hackAmount));
}