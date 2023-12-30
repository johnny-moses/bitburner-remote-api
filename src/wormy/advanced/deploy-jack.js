/** @param {NS} ns **/
export async function main(ns) {
    const scriptToRun = 'wormy/advanced/jackx.js';
    let servers = ns.scan('home');
    await runScriptOnServers(ns, servers, scriptToRun);
}

async function runScriptOnServers(ns, servers, scriptToRun) {
    for(let i = 0; i < servers.length; i++) {
        if (!ns.isRunning(scriptToRun, 'home', servers[i])) {
            if (servers[i] === 'home') {
                continue;
            }
            if (ns.getServerRequiredHackingLevel(servers[i]) <= ns.getHackingLevel() && ns.hasRootAccess(servers[i])) {
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