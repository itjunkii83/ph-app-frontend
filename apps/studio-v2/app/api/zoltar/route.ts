import { NextRequest, NextResponse } from 'next/server';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import { isKnownModel } from '@/lib/zoltar/models';
import { buildSystemPrompt } from '@/lib/zoltar/prompt';
import { ZoltarTurnSchema, zoltarTurnJsonSchema } from '@/lib/zoltar/schema';
import { emptyUserModel, type UserModel } from '@/lib/zoltar/types';

export const runtime = 'nodejs';

// Zoltar's one model call per turn. The OpenRouter key is read here only and never
// leaves the server; the client calls this route with authedFetch. No Firebase writes.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

interface Body {
  modelId: string;
  thinking: boolean;
  messages: { role: 'user' | 'assistant'; content: string }[];
  userModel: UserModel;
}

// Some providers still wrap the object in a code fence despite instructions.
function extractJson(content: string): string {
  const trimmed = content.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1].trim() : trimmed;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireUser(request))) return unauthorized();

    const key = process.env.NEXT_OPEN_ROUTE_KEY;
    if (!key) {
      return NextResponse.json({ error: 'NEXT_OPEN_ROUTE_KEY is not configured on the server.' }, { status: 500 });
    }

    const body = (await request.json()) as Partial<Body>;
    const modelId = body.modelId ?? '';
    if (!isKnownModel(modelId)) {
      return NextResponse.json({ error: `Unknown modelId: ${modelId}` }, { status: 400 });
    }
    const thinking = Boolean(body.thinking);
    const userModel = body.userModel ?? emptyUserModel();
    const history: ChatMessage[] = (body.messages ?? []).map((m) => ({ role: m.role, content: m.content }));

    const systemPrompt = buildSystemPrompt(userModel);
    const baseMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...history];

    const buildRequest = (messages: ChatMessage[], withReasoning: boolean) => {
      const req: Record<string, unknown> = {
        model: modelId,
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'zoltar_turn', strict: true, schema: zoltarTurnJsonSchema },
        },
      };
      if (withReasoning) req.reasoning = thinking ? { effort: 'medium' } : { effort: 'none' };
      return req;
    };

    const headers = {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pauseharbor.studio',
      'X-Title': 'Pause Harbor Studio',
    };

    // One network call. Returns the parsed JSON plus status for inspection.
    const call = async (reqBody: Record<string, unknown>) => {
      const res = await fetch(OPENROUTER_URL, { method: 'POST', headers, body: JSON.stringify(reqBody) });
      const text = await res.text();
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw_text: text };
      }
      return { status: res.status, ok: res.ok, json };
    };

    let reasoningUnsupported = false;
    let activeBody = buildRequest(baseMessages, true);
    let result = await call(activeBody);

    // Reasoning fallback: some models reject the reasoning param. Retry once without it.
    if (!result.ok && result.status === 400 && JSON.stringify(result.json).toLowerCase().includes('reasoning')) {
      reasoningUnsupported = true;
      activeBody = buildRequest(baseMessages, false);
      result = await call(activeBody);
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: 'OpenRouter request failed', status: result.status, raw: { request: activeBody, response: result.json } },
        { status: 502 },
      );
    }

    // Pull content + usage from a successful completion.
    const readCompletion = (json: unknown) => {
      const j = json as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      return {
        content: j.choices?.[0]?.message?.content ?? '',
        usage: {
          prompt_tokens: j.usage?.prompt_tokens ?? 0,
          completion_tokens: j.usage?.completion_tokens ?? 0,
        },
      };
    };

    const tryParse = (content: string) => {
      try {
        return ZoltarTurnSchema.safeParse(JSON.parse(extractJson(content)));
      } catch (e) {
        return { success: false as const, error: { message: `Not valid JSON: ${(e as Error).message}` } };
      }
    };

    let { content, usage } = readCompletion(result.json);
    let parsed = tryParse(content);

    // Validation retry: show the model its error once and ask for the object again.
    if (!parsed.success) {
      const errMsg = 'message' in parsed.error ? parsed.error.message : JSON.stringify(parsed.error);
      const retryMessages: ChatMessage[] = [
        ...baseMessages,
        { role: 'assistant', content },
        {
          role: 'user',
          content: `Your last response failed validation: ${errMsg}. Return only the JSON object matching the schema, nothing else.`,
        },
      ];
      activeBody = buildRequest(retryMessages, !reasoningUnsupported);
      result = await call(activeBody);
      if (result.ok) {
        ({ content, usage } = readCompletion(result.json));
        parsed = tryParse(content);
      }
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Response failed schema validation', raw: { request: activeBody, response: result.json }, content },
        { status: 422 },
      );
    }

    // raw.request carries no key: the Authorization header lives in `headers`, not
    // in the body we store here.
    return NextResponse.json({
      turn: parsed.data,
      usage: { ...usage, reasoningUnsupported },
      raw: { request: activeBody, response: result.json },
    });
  } catch (error) {
    console.error('Zoltar route error:', error);
    return NextResponse.json({ error: 'Zoltar route failed' }, { status: 500 });
  }
}
