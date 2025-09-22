

export class BashCommands {
    constructor() {
        this.root_path = "http://localhost:3000/david"
        this.commands = ["ls"]
        this.current = "http://localhost:3000/david/"
    }

    async ls(args, mcp) {
        let url = this.current + args.split(" ")[0] + "/"

        let call_tool = {
            toolName: "interacting_with_solid_server",
            toolArgs: { "url": url, "method": "GET", "headers": { "accept": "application/json" } }
        }
        const result = await mcp.callTool({
            name: call_tool.toolName,
            arguments: call_tool.toolArgs,
        });
        // console.log(result)
        let response = JSON.parse(result.content[0].text).body.map(r => r['@id'])
        return response
    }
}