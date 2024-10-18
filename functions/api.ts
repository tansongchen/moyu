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
    const datetimes = results.map((x) => {
      const date = x.properties["日期"];
      if (date.type !== "date") {
        return undefined;
      }
      return date.date.start as string;
    });
    return new Response(JSON.stringify(datetimes));
  } else if (request.method == "POST") {
    const { datetime } = await request.json<{ datetime: string }>();
    const response = await notion.pages.create({
      parent: { type: "database_id", database_id },
      properties: {
        名称: {
          type: "title",
          title: [{ type: "text", text: { content: "谭淞宸今天摸鱼了吗？" } }],
        },
        日期: {
          type: "date",
          date: { start: datetime },
        },
      },
    });
    return new Response(JSON.stringify(response));
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
};
