export async function main(ns) {
    // Function to scan for all servers
    function scanServers(ns, startServer = "home") {
        const serversToScan = [startServer];
        const scannedServers = new Set();
        while (serversToScan.length > 0) {
            const server = serversToScan.pop();
            if (!scannedServers.has(server)) {
                scannedServers.add(server);
                serversToScan.push(...ns.scan(server));
            }
        }
        return [...scannedServers];
    }

    // Function to deploy and run bm.js on a server
    async function deployAndRunScript(ns, server) {
        // Check if bm.js is already running with the target server as an argument
        const runningScripts = ns.ps('home');
        const isAlreadyRunning = runningScripts.some(script => script.filename === 'src/bm.js' && script.args.includes(server));

        // Skip deployment if bm.js is already running against this server
        if (isAlreadyRunning) {
            ns.print(`INFO: Skipping ${server} - batch manager already running.`);
            return;
        }

        // Run the bm.js script on the home server with the server as the argument
        const pid = ns.run('src/bm.js', 1, server);
        if (pid !== 0) {
            ns.tprint(`SUCCESS: Executed batch manager on home server for target ${server} (PID: ${pid})`);
        }
        else {
            ns.tprint(`ERROR: Failed to execute batch manager for target ${server}`);
        }
    }

    ns.run('src/worm.js');
    await ns.sleep(11000);
    ns.run('src/hacknet.js')

    while (true) {
        const servers = scanServers(ns);
        const playerHackingLevel = ns.getHackingLevel();

        for (const server of servers) {
            const hackingLevelRequired = ns.getServerRequiredHackingLevel(server);
            const maxMoney = ns.getServerMaxMoney(server);

            // If the player's hacking level is high enough, we have root access, and maxMoney > 0, deploy and run the script
            if (playerHackingLevel >= hackingLevelRequired && ns.hasRootAccess(server) && maxMoney > 0 && server !== 'home') {
                await deployAndRunScript(ns, server);
            }
            else if (maxMoney === 0) {
                ns.print(`INFO: Skipping ${server} - maxMoney is 0.`);
            }
        }

        await ns.sleep(60000);  // Sleep for 60 seconds before checking again
    }
}