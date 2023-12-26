/** @param {NS} ns **/
export async function main(ns) {
    var totalSpent = 0;  // Tracks how much money we have spent on nodes
    ns.tprint("Hacknet Node Manager Started");

    // Bring all available hacknet nodes up to base level
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        var node = ns.hacknet.nodes[i];
        var cost = node.getLevelUpgradeCost(1);
        totalSpent += cost;  // Add the upgrade cost to the money spent
        node.upgradeLevel(1);
    }

    // Mandatory wait period to allow earnings to accumulate
    await ns.sleep(60000);

    while (true) { // Loop keeps the script running forever
        var totalEarned = 0;

        // Sum earnings from all nodes
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            var node = ns.hacknet.nodes[i];
            totalEarned += node.totalMoneyEarned; // Add the earnings from each node to total
        }

        // Check if we have enough earnings to buy a new node
        if (totalEarned >= totalSpent * 3) {
            var newNode = ns.hacknet.purchaseNode();
            if(newNode !== -1) {
                var cost = ns.hacknet.nodes[newNode].getLevelUpgradeCost(1);
                totalSpent += cost;  // Add cost to the money spent
                ns.hacknet.node[newNode].upgradeLevel(1);
            }
        }

        await ns.sleep(30000); // Check for upgrades every 30 seconds
    }
}