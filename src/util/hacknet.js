/** @param {NS} ns **/
export async function main(ns) {
    ns.tprint('Buying Hacknet Nodes');
    var totalNodes = 12;
    for (var i = ns.hacknet.numNodes(); i < totalNodes; i++) {
        ns.hacknet.purchaseNode();
    }
    for (i = 0; i < ns.hacknet.numNodes(); i++) {
        while (ns.hacknet.getLevel(i) < ns.hacknet.getMaximumLevel()) {
            ns.hacknet.upgradeLevel(i);
        }
    }
}