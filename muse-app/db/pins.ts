import {env} from "cloudflare:workers";
export function pinsDb(){if(!env.DB)throw new Error("Pin storage unavailable");return env.DB;}
