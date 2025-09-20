import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { Session } from "@inrupt/solid-client-authn-node";
import dotenv from 'dotenv'

import { holacratieOperations } from './src/utils/holacratieOperations.js';


dotenv.config({ path: '.env' })
const session = new Session();
await session.login({
    oidcIssuer: process.env.OPENID_PROVIDER,
    clientId: process.env.TOKEN_IDENTIFIER,
    clientSecret: process.env.TOKEN_SECRET,
});
