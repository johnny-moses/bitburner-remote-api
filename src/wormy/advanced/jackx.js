/* eslint-disable no-constant-condition */
// Description: Attack deployment manager. This script will automatically launch grow/weaken/hack scripts as needed.
// Uses grow.js, weaken.js, and hack.js to attack a target server.

// This version will launch batches of scripts at a time to reduce the number of API calls and improve performance.


const moneyThreshold = 0.75; // 75% of max money
const ramBuffer = 12; // Reserve 12GB of RAM

/** @param {NS} ns **/
export async function main(ns) {
    const targets = ns.args[0].split(",");
    const hostServer = ns.getHostname();

    if (!targets || targets.length === 0) {
        ns.tprint("Error: No targets specified. Exiting.");
        return;
    }

    if (!ns.fileExists("formulas.exe", "home")) {
        ns.tprint("Error: formulas.exe is required for this script to run.");
        return;
    }

    // Batch job distribution logic for each target
    while (true) {

        for (const target of targets) {
            // Monitor security level of the target
            const securityThreshold = ns.getServerMinSecurityLevel(target) + 10;  //
            const currentSecurity = ns.getServerSecurityLevel(target);
            const availableFunds = ns.getServerMoneyAvailable(target);
            const MaxFunds = ns.getServerMaxMoney(target);

            if (currentSecurity >= securityThreshold) {
                // Kill grow and hack processes
                killGrowAndHack(ns, hostServer, target);

                // Deploy weaken scripts
                // Delete this line if it still works
                // const weakenThreads = calculateWeakenThreads(ns, target, currentSecurity, securityThreshold);
                deployWeaken(ns, hostServer, target);

                break; // Move to the next target
            }

                // Security is too high, kill all grow and hack processes and deploy weaken scripts
            if (currentSecurity <= securityThreshold && availableFunds >= MaxFunds) {
                killGrowAndHack(ns, hostServer, target);
                deployHack(ns, hostServer, target);

                break;
            }

            try {
                const currentMoney = ns.getServerMoneyAvailable(target);
                const maxMoney = ns.getServerMaxMoney(target);

                // Decide the action to take based on current server stats
                let action;
                let threadsNeeded;
                if (currentSecurity > securityThreshold) {
                    action = 'weaken';
                    threadsNeeded = calculateWeakenThreads(ns, target, currentSecurity, securityThreshold);
                } else if (currentMoney < maxMoney * moneyThreshold) {
                    action = 'grow';
                    threadsNeeded = calculateGrowThreads(ns, target, currentMoney, maxMoney);
                } else {
                    action = 'hack';
                    threadsNeeded = calculateHackThreads(ns, target, currentMoney);
                }
                const scriptRam = ns.getScriptRam(`/${action}.js`, hostServer);
                if (scriptRam <= 0) {
                    ns.tprint(`Error: Script RAM usage is zero or invalid for ${action}.js on server ${hostServer}`);
                    return;
                }

                let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
                let scriptsToLaunch = Math.floor(availableRam / scriptRam);
                scriptsToLaunch = Math.min(scriptsToLaunch, threadsNeeded);

                for (let i = 0; i < scriptsToLaunch; i++) {
                    const pid = ns.exec(`/wormy/advanced/scripts/${action}.js`, hostServer, 1, target);
                    if (pid === 0) {
                        ns.tprint(`Failed to start ${action}.js on target: ${target} from server ${hostServer}.`);
                        break;
                    }
                    availableRam -= scriptRam;
                }

                // ns.tprint(`Batch execution complete for ${target}. Moving to next target.`);
                await ns.sleep(500); // Adjust as needed based on script run times
            } catch (e) {
                ns.tprint(`An error occurred on server ${hostServer}: ${e}`);
                await ns.sleep(1000);
            }
        }
        await ns.sleep(5000); // Wait before restarting the loop
    }


    function calculateWeakenThreads(ns, target, currentSecurity, securityThreshold) {
        const weakenAmount = ns.weakenAnalyze(1); // The amount of security reduced by a single thread
        const securityDifference = currentSecurity - securityThreshold;
        return Math.ceil(securityDifference / weakenAmount);
    }


    function calculateGrowThreads(ns, target, currentMoney, maxMoney) {
        const moneyNeeded = maxMoney * moneyThreshold - currentMoney;
        const growMultiplier = ns.growthAnalyze(target, moneyNeeded, ns.getServer(target).cores);
        return Math.ceil(growMultiplier);
    }


    function calculateHackThreads(ns, target, currentMoney) {
        const hackPercent = 0.1; //hacks 10% of the available money
        const moneyToSteal = currentMoney * hackPercent;
        const hackChance = ns.hackAnalyzeChance(target);
        const hackAmount = ns.hackAnalyze(target); // The amount of money stolen by a single thread
        return Math.ceil((moneyToSteal / hackAmount) / hackChance);
    }

    function deployWeaken(ns, hostServer, target) {
        const currentSecurity = ns.getServerSecurityLevel(target);
        const securityThreshold = ns.getServerMinSecurityLevel(target) + 10;
        const threadsNeeded = calculateWeakenThreads(ns, target, currentSecurity, securityThreshold);

        const scriptRam = ns.getScriptRam('wormy/advanced/scripts/weaken.js', hostServer);
        let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
        let scriptsToLaunch = Math.min(Math.floor(availableRam / scriptRam), threadsNeeded);

        for (let i = 0; i < scriptsToLaunch; i++) {
            ns.exec('wormy/advanced/scripts/weaken.js', hostServer, 1, target);
        }
    }

    function killGrowAndHack(ns, hostServer, target) {
        // Get all running scripts on the host server
        const runningScripts = ns.ps(hostServer);
        for (const process of runningScripts) {
            if ((process.filename === 'wormy/advanced/scripts/grow.js' || process.filename === 'wormy/advanced/scripts/hack.js') && process.args.includes(target)) {
                ns.kill(process.pid); // Kill the process if it's grow or hack targeting the specific server
            }
        }
    }

    function killGrow(ns, hostServer, target) {
        // Get all running scripts on the host server
        const runningScripts = ns.ps(hostServer);
        for (const process of runningScripts) {
            if ((process.filename === 'wormy/advanced/scripts/grow.js') && process.args.includes(target)) {
                ns.kill(process.pid); // Kill the process if it's grow or hack targeting the specific server
            }
        }
    }

    function deployHack(ns, hostServer, target) {
        const currentMoney = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
        const threadsNeeded = calculateHackThreads(ns, target, currentMoney);

        const scriptRam = ns.getScriptRam('wormy/advanced/scripts/hack.js', hostServer);
        let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
        let scriptsToLaunch = Math.min(Math.floor(availableRam / scriptRam), threadsNeeded);

        for (let i = 0; i < scriptsToLaunch; i++) {
            ns.exec('wormy/advanced/scripts/hack.js', hostServer, 1, target);
        }
    }
}

