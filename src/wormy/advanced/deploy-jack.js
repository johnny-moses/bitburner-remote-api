/** @param {NS} ns **/
export async function main(ns) {
    // Function to recursively scan the network
    function scanNetwork(server, visited) {
        visited.add(server);
        let connections = ns.scan(server);
        for (const target of connections) {
            if (!visited.has(target)) {
                scanNetwork(target, visited);
            }
        }
    }

    // Set the script to run on each server
    const scriptToRun = 'wormy/advanced/jackx.js';

    // Scan the network
    let allServers = new Set();
    scanNetwork('home', allServers);

    // Run the script on each server
    for (const server of allServers) {
        if (ns.serverExists(server) && server !== 'home') {
            await ns.scp(scriptToRun, 'home', server);
            ns.print(`SUCCESS: Deploying JACKX.js on: ${server}`)
            ns.exec(scriptToRun, 'home', 1, server);
        }
    }
}