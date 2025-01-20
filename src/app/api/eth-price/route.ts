export const runtime = "edge";

import { NextResponse } from "next/server";

const COINGECKO_KEY = process.env.COINGECKO_KEY;

export async function GET() {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?x-cg-pro-api-key=${COINGECKO_KEY}&ids=ethereum&vs_currencies=usd`,
      { method: "GET" },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300",
        "content-type": "application/json",
        "CDN-Cache-Control": "public, s-maxage=300",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while fetching the data" },
      { status: 500 },
    );
  }
}
