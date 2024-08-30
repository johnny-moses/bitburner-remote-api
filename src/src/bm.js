export async function main(ns) {
    // Ensure the script is running on the home server
    if (ns.getHostname() !== 'home') {
        ns.tprint("This script should only be run from the home server. Exiting...");
        return;
    }

    const primaryTarget = ns.args[0];
    const reservedRam = 8;  // Reserve 8 GB of RAM on home server
    let startTimes = {};
    let allRootedServers = [];

    const getSecurity = (targetServer) => ns.getServerSecurityLevel(targetServer);
    const getMoney = (targetServer) => ns.getServerMoneyAvailable(targetServer);
    const getMinSecurity = (targetServer) => ns.getServerMinSecurityLevel(targetServer);
    const getMaxMoney = (targetServer) => ns.getServerMaxMoney(targetServer);

    // Function to get all servers and root new ones
    async function getAllServers(ns, startServer) {
        let servers = new Set([startServer]);
        let visited = {startServer: true};
        let i = 0;

        while (i < Array.from(servers).length) {
            let nextServer = Array.from(servers)[i];
            let newServers = ns.scan(nextServer);

            for (let newServer of newServers) {
                if (!visited[newServer] && newServer !== 'trader') {  // Exclude 'trader'
                    servers.add(newServer);
                    visited[newServer] = true;
                }
            }

            i++;
        }

        let newlyRootedServers = [];
        for (let server of Array.from(servers)) {
            if (!ns.hasRootAccess(server) && server !== 'trader') {  // Exclude 'trader'
                let openPorts = 0;
                let portsRequired = ns.getServerNumPortsRequired(server);
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
                if (portsRequired <= openPorts) {
                    await ns.nuke(server);
                    newlyRootedServers.push(server);
                    ns.tprint(`Gained root access to: ${server}`);
                }
            }

            if (ns.hasRootAccess(server) && server !== 'trader' && !allRootedServers.includes(server)) {  // Exclude 'trader'
                allRootedServers.push(server);
                newlyRootedServers.push(server);
            }
        }

        return newlyRootedServers;
    }

    // Function to deploy scripts to rooted servers
    async function deployScriptsToServers(ns, servers, scripts) {
        for (let server of servers) {
            if (server === 'trader') continue;  // Skip 'trader'
            for (let script of scripts) {
                if (!ns.fileExists(script, server)) {
                    await ns.scp(`${script}`, server);
                    ns.tprint(`Copied ${script} to server ${server}`);
                }
            }
        }
    }

    const scripts = ['/src/scripts/hack.js', '/src/scripts/weaken.js', '/src/scripts/grow.js'];

    // Initial rooting and deployment
    let rootedServers = await getAllServers(ns, 'home');
    await deployScriptsToServers(ns, rootedServers, scripts);

    var scriptQueue = [];

    const scheduleScript = async (script, hostServer, startTime, targetServer, runtime) => {
        scriptQueue.push({
            script: script,
            hostServer: hostServer,
            startTime: startTime,
            targetServer: targetServer,
            runtime: runtime
        });
    };

    // Function to calculate number of scripts needed to hit thresholds
    function calculateScriptsNeeded(ns, target, minSecurity, maxMoney) {
        const currentSecurity = getSecurity(target);
        const currentMoney = getMoney(target);
        const securityThreshold = minSecurity + 5;
        const moneyThreshold = maxMoney * 0.75;

        let weakenScripts = 0;
        let growScripts = 0;
        let hackScripts = 0;

        // Calculate how many weaken scripts are needed to reduce security to threshold
        const weakenAmountPerScript = ns.weakenAnalyze(1);
        while (currentSecurity - weakenScripts * weakenAmountPerScript > securityThreshold) {
            weakenScripts++;
        }

        // Calculate how many grow scripts are needed to increase money to threshold
        if (currentMoney < moneyThreshold && currentSecurity < 100) {
            const growthAmount = ns.growthAnalyze(target, moneyThreshold / currentMoney);
            growScripts = Math.ceil(growthAmount);
        }

        // Calculate how many hack scripts are needed to reach the desired money level
        const hackPercentage = ns.hackAnalyze(target);
        while (currentMoney - hackScripts * hackPercentage * currentMoney > moneyThreshold) {
            hackScripts++;
        }

        return {weakenScripts, growScripts, hackScripts};
    }

    // Function to calculate the impact of each script and adjust batching accordingly
    async function adjustBatching(ns, target) {
        if (target === 'trader') return [];  // Skip 'trader'
        const currentSecurity = getSecurity(target);
        const currentMoney = getMoney(target);
        const minSecurity = getMinSecurity(target);
        const maxMoney = getMaxMoney(target);
        let {weakenScripts, growScripts, hackScripts} = calculateScriptsNeeded(ns, target, minSecurity, maxMoney);

        let scriptPlan = [];
        let runtime;

        // Weaken first if security is too high
        if (weakenScripts > 0) {
            runtime = ns.getWeakenTime(target);
            scriptPlan.push({script: '/src/scripts/weaken.js', count: weakenScripts, runtime});
        }

        // Grow next if money is too low and security is under control
        if (growScripts > 0 && currentSecurity < 100) {
            runtime = ns.getGrowTime(target);
            scriptPlan.push({script: '/src/scripts/grow.js', count: growScripts, runtime});
        }

        // Hack last to extract money
        if (hackScripts > 0) {
            runtime = ns.getHackTime(target);
            scriptPlan.push({script: '/src/scripts/hack.js', count: hackScripts, runtime});
        }

        return scriptPlan;
    }

    if (primaryTarget && primaryTarget !== 'trader') {  // Skip 'trader'
        // Initial scheduling based on current server state and predictions
        let scriptPlan = await adjustBatching(ns, primaryTarget);
        for (let job of scriptPlan) {
            for (let i = 0; i < job.count; i++) {
                await scheduleScript(job.script, 'home', new Date(), primaryTarget, job.runtime);
            }
        }
    }

    while (true) {
        let now = new Date();

        // Get newly rooted servers and deploy scripts
        let newRootedServers = await getAllServers(ns, 'home');
        if (newRootedServers.length > 0) {
            await deployScriptsToServers(ns, newRootedServers, scripts);
        }

        if (scriptQueue.length > 0 && now >= scriptQueue[0].startTime) {
            var job = scriptQueue[0];
            var script = job.script;
            var hostServer = job.hostServer;
            const targetServer = job.targetServer;
            var ramRequired = ns.getScriptRam(script);

            let serverToRunOn = hostServer;

            // Adjust available RAM on home server, reserving 8 GB
            if (hostServer === 'home') {
                let homeServerMaxRam = ns.getServerMaxRam('home') - reservedRam;
                let homeServerUsedRam = ns.getServerUsedRam('home');
                let availableHomeRam = homeServerMaxRam - homeServerUsedRam;

                // If not enough RAM on home server, find another server
                if (ramRequired > availableHomeRam) {
                    serverToRunOn = allRootedServers.find(server =>
                        server !== 'home' &&
                        server !== 'trader' &&  // Skip 'trader'
                        ns.getServerMaxRam(server) - ns.getServerUsedRam(server) >= ramRequired
                    );
                }
            } else {
                serverToRunOn = allRootedServers.find(server =>
                    server !== 'trader' &&  // Skip 'trader'
                    ns.getServerMaxRam(server) - ns.getServerUsedRam(server) >= ramRequired
                );
            }

            if (!serverToRunOn) {
                await ns.sleep(1000);  // Correct sleep to 1000ms (1 second)
                continue;
            }

            // Ensure only hack, weaken, grow scripts are executed
            if (script === '/src/scripts/hack.js' || script === '/src/scripts/weaken.js' || script === '/src/scripts/grow.js') {
                ns.exec(script, serverToRunOn, 1, targetServer);
            }
            startTimes[job.script] = job.startTime;
            scriptQueue.shift();  // Remove the executed job from the queue
        }

        if (scriptQueue.length === 0) {
            if (primaryTarget && primaryTarget !== 'trader') {  // Skip 'trader'
                var scriptPlan = await adjustBatching(ns, primaryTarget);
                for (let job of scriptPlan) {
                    for (let i = 0; i < job.count; i++) {
                        await scheduleScript(job.script, 'home', new Date(), primaryTarget, job.runtime);
                    }
                }
            }
        }

        await ns.sleep(1000);  // Correct sleep to 1000ms (1 second )
    }
}