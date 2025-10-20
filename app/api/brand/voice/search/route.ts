import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/auth-utils";
import { OpenAIEmbeddings } from "@langchain/openai";
import { db } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const auth = await validateSession(request);
    if (!auth.valid || !auth.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { query, k = 5 } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "Missing 'query'" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
    }

    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
    const vector = await embeddings.embedQuery(query);

    const client = db.getClient();
    const { data, error } = await client.rpc('match_brand_voice', {
      query_embedding: vector as unknown as any,
      match_count: k,
      user_filter: auth.user.id
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, matches: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


