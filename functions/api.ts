import { Client } from "@notionhq/client";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

interface Env {
  TOKEN: string;
}

const database_id = "11e21eb647fe804d94e3fd2a833fde7a";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const notion = new Client({
    auth: env.TOKEN,
  });

  if (request.method == "GET") {
    const data = await notion.databases.query({ database_id });
    const results = data.results as DatabaseObjectResponse[];
    const times = results.map((x) => {
      const date = x.properties["日期"] as unknown as {
        date: { start: string };
      };
      return date.date.start;
    });
    return new Response(JSON.stringify(times));
  } else if (request.method == "POST") {
    const response = await notion.pages.create({
      parent: { type: "database_id", database_id },
      properties: {
        名称: {
          type: "title",
          title: [{ type: "text", text: { content: "谭淞宸今天摸鱼了吗？" } }],
        },
        日期: {
          type: "date",
          date: { start: new Date().toISOString() },
        },
      },
    });
    return new Response(JSON.stringify(response));
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
};
