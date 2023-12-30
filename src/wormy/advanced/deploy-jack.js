/** @param {NS} ns **/
export async function main(ns) {
    const scriptToRun = 'wormy/advanced/jackx.js';

    // Outermost loop to keep the script running indefinitely
    while (true) {
        let servers = ns.scan('home');
        await runScriptOnServers(ns, servers, scriptToRun);

        // Sleep before starting another round of deploying
        ns.print(`Completed a round of server script deployments. Starting again in 1 minute.`);
        await ns.sleep(60000);
    }
}

async function runScriptOnServers(ns, servers, scriptToRun) {
    for (let i = 0; i < servers.length; i++) {
        if (!ns.isRunning(scriptToRun, 'home', servers[i])) {
            if (servers[i] === 'home') {
                continue;
            }
            if (ns.getServerRequiredHackingLevel(servers[i]) <= ns.getHackingLevel() && ns.hasRootAccess(servers[i])) {
                if(ns.getServerMaxMoney(servers[i]) === 0){
                    ns.tprint(`Skipping ${servers[i]} because it has no money`);
                    continue;
                }

                ns.exec(scriptToRun, 'home', 1, servers[i])
                ns.tprint(`SUCCESS: Deployed JACKX on ${servers[i]}`);
                await ns.sleep(50)

                // If a server is not running the script, then we scan for its connected servers and run the script on them as well
                let connectedServers = ns.scan(servers[i]);
                await runScriptOnServers(ns, connectedServers, scriptToRun);
            }
        } else {
            ns.print(`JACKX already running on ${servers[i]}`);
        }
    }
}