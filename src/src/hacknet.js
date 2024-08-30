/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");

    const { hacknet } = ns;

    const maxValues = {
        cores: 16,
        level: 200,
        ram: 64
    };

    const upgradeCostFunc = {
        cores: hacknet.getCoreUpgradeCost,
        level: hacknet.getLevelUpgradeCost,
        ram: hacknet.getRamUpgradeCost
    };

    const maxNodes = hacknet.maxNumNodes();

    function getUpgradeInfo(index, stats, field) {
        if (stats[field] === maxValues[field]) {
            return undefined; // Already maxed out
        }
        const cost = upgradeCostFunc[field](index, 1);
        return { cost };
    }

    function getPurchaseInfo() {
        if (hacknet.numNodes() === maxNodes) {
            return undefined; // Can't purchase anymore
        }
        const cost = hacknet.getPurchaseNodeCost();
        return { cost };
    }

    function getOwnedHacknetNodes() {
        const nodes = [];
        for (let i = 0; i < hacknet.numNodes(); i++) {
            const stats = hacknet.getNodeStats(i);
            const nodeInfo = { ...stats, id: i };
            for (const field of Object.keys(upgradeCostFunc)) {
                nodeInfo[`${field}Upgrade`] = getUpgradeInfo(i, stats, field);
            }
            nodes.push(nodeInfo);
        }
        return nodes;
    }

    function getBestNodesToUpgrade(nodes) {
        const nodesToUpgrade = {
            cores: undefined,
            ram: undefined,
            level: undefined
        };
        for (const node of nodes) {
            for (const field of Object.keys(nodesToUpgrade)) {
                const upgradeInfo = node[`${field}Upgrade`];
                if (!upgradeInfo) {
                    continue;
                }

                if (!nodesToUpgrade[field] || upgradeInfo.cost < nodesToUpgrade[field].cost) {
                    nodesToUpgrade[field] = {
                        node: node.id,
                        cost: upgradeInfo.cost
                    };
                }
            }
        }
        return nodesToUpgrade;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact'
        }).format(value);
    }

    async function waitForMoney(cost) {
        while (ns.getServerMoneyAvailable("home") < cost) {
            await ns.sleep(10000); // wait 10s
        }
    }

    async function purchaseNewNode(cost) {
        await waitForMoney(cost);
        ns.print(`PURCHASING NODE @ ${formatCurrency(cost)}`);
        hacknet.purchaseNode();
    }

    async function upgradeNode(field, node, cost) {
        await waitForMoney(cost);
        ns.print(`UPGRADING ${field.toUpperCase()} - Node ${node} @ ${formatCurrency(cost)}`);
        switch (field) {
            case "cores":
                hacknet.upgradeCore(node, 1);
                break;
            case "level":
                hacknet.upgradeLevel(node, 1);
                break;
            case "ram":
                hacknet.upgradeRam(node, 1);
                break;
        }
    }

    async function doNextAction(purchaseInfo, nodesToUpgrade, budget) {
        if (purchaseInfo && purchaseInfo.cost <= budget) {
            await purchaseNewNode(purchaseInfo.cost);
            return;
        }

        for (const field of Object.keys(nodesToUpgrade)) {
            const upgrade = nodesToUpgrade[field];
            if (upgrade && upgrade.cost <= budget) {
                await upgradeNode(field, upgrade.node, upgrade.cost);
                return;
            }
        }
    }

    while (true) {
        const homeMoney = ns.getServerMoneyAvailable("home");
        const budget = homeMoney * 0.05;  // 5% of home server money for Hacknet upgrades

        ns.print(`Current Budget: ${formatCurrency(budget)}`);

        const nodes = getOwnedHacknetNodes();
        const nodesToUpgrade = getBestNodesToUpgrade(nodes);
        const purchaseInfo = getPurchaseInfo();

        await doNextAction(purchaseInfo, nodesToUpgrade, budget);
        await ns.sleep(60000); // Repeat every minute
    }
}
