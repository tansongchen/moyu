import { Client } from "@notionhq/client";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

interface Env {
  TOKEN: string;
}

interface Data {
  datetime: string;
  name: string;
}

const database_id = "11e21eb647fe804d94e3fd2a833fde7a";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const notion = new Client({
    auth: env.TOKEN,
  });

  if (request.method == "GET") {
    const data = await notion.databases.query({ database_id });
    const results = data.results as DatabaseObjectResponse[];
    const datetimes: Data[] = [];
    results.forEach((x) => {
      const date = x.properties["日期"];
      const name = x.properties["名称"];
      if (date.type === "date" && name.type === "title") {
        datetimes.push({
          datetime: date.date.start as string,
          name: (name.title[0] as { plain_text: string }).plain_text,
        });
      }
    });
    return new Response(JSON.stringify(datetimes));
  } else if (request.method == "POST") {
    const { name, datetime } = await request.json<Data>();
    const response = await notion.pages.create({
      parent: { type: "database_id", database_id },
      properties: {
        名称: {
          type: "title",
          title: [{ type: "text", text: { content: name } }],
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
