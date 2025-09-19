import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import readline from "readline";
import { Drknow } from "./src/index.js";
const require = createRequire(import.meta.url);
const { prompt } = require("enquirer");

const program = new Command();
program.name("drknow").description("CLI minimal (base propre)").version("1.0.0");
let dk = new Drknow()
// Ajoutez vos commandes ici



function startRepl() {
    console.log(chalk.cyan("ls, pwd, cat, cd, rm, touch, cat, vi, mkdir - tapez 'exit' pour quitter"));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> ",
    });
    rl.prompt();
    rl.on("line", async (line) => {
        const input = line.trim();
        if (!input) {
            rl.prompt();
            return;
        }
        if (input === "exit" || input === "quit") {
            rl.close();
            return;
        }

        let cmd = input.split(" ")[0]
        switch (cmd) {
            case "list":
            case "ls":
                dk.list()
                break;
            case "pwd":
                dk.list()
                break;
            case "cd":
                dk.list()
                break;
            case "rm":
                dk.list()
                break;
            case "touch":
                dk.list()
                break;
            case "cat":
                dk.list()
                break;
            case "vi":
                dk.list()
                break;
            case "mkdir":
                dk.list()
                break;
            case "echo":
                dk.list()
                break;
            default:
                break;
        }



        rl.prompt();
    });
    rl.on("close", () => process.exit(0));
}

if (process.argv.length <= 2) {
    startRepl();
} else {
    program.parse(process.argv);
}
