// Description: Attack deployment manager. This script will automatically launch grow/weaken/hack scripts as needed.
// Uses grow.js, weaken.js, and hack.js to attack a target server.
// Usage: run jack.js [target]

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const hostServer = ns.getHostname();
    const moneyThreshold = 0.90; // 75% of max money
    const ramBuffer = 2.5; // Reserve 2.5GB of RAM

    if (!target) {
        ns.tprint("Error: No target specified. Exiting.");
        return;
    }

    ns.tprint(`Starting advanced attack script on target: ${target} from server: ${hostServer}`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const currentSecurity = ns.getServerSecurityLevel(target);
            const securityThreshold = ns.getServerMinSecurityLevel(target) + 10;
            const lowSecurityThreshold = ns.getServerSecurityLevel(target) + 1;
            const currentMoney = ns.getServerMoneyAvailable(target);
            const maxMoney = ns.getServerMaxMoney(target);

            // If security is too high, kill all grow and hack processes and deploy weaken scripts
            if (currentSecurity >= securityThreshold) {
                // Kill grow and hack processes
                killGrowAndHack(ns, hostServer, target);
                deployWeaken(ns, hostServer, target);

                break;

            // If security is low enough, and target has maxMoney available, kill all grow and weaken processes and deploy hack scripts
            } else if (currentSecurity <= securityThreshold && currentMoney >= maxMoney) {
                killGrowAndHack(ns, hostServer, target);
                deployHack(ns, hostServer, target);

                break;

            // if security is at minimum, and target has maxMoney available, kill all grow and weaken processes and deploy hack scripts
            } else if (currentSecurity <= lowSecurityThreshold && currentMoney >= maxMoney) {
                killGrowAndWeaken(ns, hostServer, target);
                deployHack(ns, hostServer, target);

                break;
            }

            let action;
            if (currentSecurity > securityThreshold) {
                action = 'weaken';
            } else if (currentMoney < maxMoney * moneyThreshold) {
                action = 'grow';
            } else {
                action = 'hack';
            }

            const scriptRam = ns.getScriptRam(`wormy/simple/scripts/${action}.js`, hostServer);
            if (scriptRam <= 0) {
                ns.tprint(`Error: Script RAM usage is zero or invalid for ${action}.js on server ${hostServer}`);
                return;
            }

            let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
            while (availableRam >= scriptRam) {
                const pid = ns.exec(`wormy/simple/scripts/${action}.js`, hostServer, 1, target);
                if (pid === 0) {
                    // ns.tprint(`Failed to start ${action}.js on target: ${target} from server ${hostServer}.`);
                    break; // Break the loop if unable to start a new process
                } else {
                    // ns.tprint(`Launched ${action}.js on target: ${target} from server ${hostServer}. PID: ${pid}`);
                    availableRam -= scriptRam;
                }
                await ns.sleep(100); // Short sleep to prevent script from hogging CPU
            }

            // ns.tprint(`Not enough RAM on server ${hostServer} to perform ${action} on target: ${target}. Waiting to retry...`);
            await ns.sleep(5000);
        } catch (e) {
            ns.tprint(`An error occurred on server ${hostServer}: ${e}`);
            await ns.sleep(1000);
        }
    }

    function calculateWeakenThreads(ns, target, currentSecurity, securityThreshold) {
        const weakenAmount = ns.weakenAnalyze(1); // The amount of security reduced by a single thread
        const securityDifference = currentSecurity - securityThreshold;
        return Math.ceil(securityDifference / weakenAmount);
    }

    function deployWeaken(ns, hostServer, target) {
        const currentSecurity = ns.getServerSecurityLevel(target);
        const securityThreshold = ns.getServerMinSecurityLevel(target) + 10;
        const threadsNeeded = calculateWeakenThreads(ns, target, currentSecurity, securityThreshold);

        const scriptRam = ns.getScriptRam('wormy/simple/scripts/weaken.js', hostServer);
        let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
        let scriptsToLaunch = Math.min(Math.floor(availableRam / scriptRam), threadsNeeded);

        for (let i = 0; i < scriptsToLaunch; i++) {
            ns.exec('wormy/simple/scripts/weaken.js', hostServer, 1, target);
        }
    }

    function killGrowAndHack(ns, hostServer, target) {
        // Get all running scripts on the host server
        const runningScripts = ns.ps(hostServer);
        for (const process of runningScripts) {
            if ((process.filename === 'wormy/simple/scripts/grow.js' || process.filename === 'wormy/simple/scripts/hack.js') && process.args.includes(target)) {
                ns.kill(process.pid); // Kill the process if it's grow or hack targeting the specific server
            }
        }
    }

    function calculateHackThreads(ns, target, currentMoney) {
        const hackPercent = 0.1; //hacks 10% of the available money
        const moneyToSteal = currentMoney * hackPercent;
        const hackChance = ns.hackAnalyzeChance(target);
        const hackAmount = ns.hackAnalyze(target); // The amount of money stolen by a single thread
        return Math.ceil((moneyToSteal / hackAmount) / hackChance);
    }

    function deployHack(ns, hostServer, target) {
        const currentMoney = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
        const threadsNeeded = calculateHackThreads(ns, target, currentMoney);

        const scriptRam = ns.getScriptRam('wormy/simple/scripts/hack.js', hostServer);
        let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
        let scriptsToLaunch = Math.min(Math.floor(availableRam / scriptRam), threadsNeeded);

        for (let i = 0; i < scriptsToLaunch; i++) {
            ns.exec('wormy/simple/scripts/hack.js', hostServer, 1, target);
        }
    }

    function killGrowAndWeaken(ns, hostServer, target) {
        // Get all running scripts on the host server
        const runningScripts = ns.ps(hostServer);
        for (const process of runningScripts) {
            if ((process.filename === 'wormy/simple/scripts/grow.js' || process.filename === 'wormy/simple/scripts/weaken.js') && process.args.includes(target)) {
                ns.kill(process.pid); // Kill the process if it's grow or weaken targeting the specific server
            }
        }
    }
}