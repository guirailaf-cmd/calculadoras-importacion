#!/usr/bin/env node
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'import_cases.json');

const REQUIRED_KEYS = [
	'slug',
	'producto',
	'hs_code',
	'origen',
	'destino',
	'moneda',
	'arancel_ad_valorem_pct',
	'iva_pct',
	'gastos_puerto_usd',
	'gastos_despacho_agente_usd',
	'flete_estimado_m3_usd',
	'permisos_especiales',
	'seo',
	'faqs',
];

function parseArgs(argv) {
	const args = { count: 10, model: 'claude-3-5-haiku-latest' };
	for (const arg of argv) {
		const [key, value] = arg.replace(/^--/, '').split(/=(.*)/s);
		if (key === 'category') args.category = value;
		if (key === 'count') args.count = Number(value);
		if (key === 'model') args.model = value;
	}
	return args;
}

function stripCodeFence(text) {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	return fenced ? fenced[1].trim() : text.trim();
}

function isValidCase(obj, existingSlugs, seenInBatch) {
	for (const key of REQUIRED_KEYS) {
		if (!(key in obj)) return { ok: false, reason: `falta la clave "${key}"` };
	}
	if (typeof obj.slug !== 'string' || !obj.slug.trim()) return { ok: false, reason: 'slug inválido' };
	if (existingSlugs.has(obj.slug) || seenInBatch.has(obj.slug)) {
		return { ok: false, reason: `slug duplicado: ${obj.slug}` };
	}
	if (!/^\d{6}$/.test(String(obj.hs_code))) return { ok: false, reason: `hs_code inválido: ${obj.hs_code}` };
	if (!obj.seo || typeof obj.seo.titulo_h1 !== 'string' || typeof obj.seo.meta_description !== 'string' || !Array.isArray(obj.seo.keywords)) {
		return { ok: false, reason: 'bloque seo incompleto' };
	}
	if (!Array.isArray(obj.faqs) || obj.faqs.length === 0) return { ok: false, reason: 'faqs incompletas' };
	return { ok: true };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	if (!args.category) {
		console.error('Uso: node scripts/generate_cases.mjs --category=<categoria> [--count=10] [--model=claude-3-5-haiku-latest]');
		process.exit(1);
	}

	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		console.error('Falta ANTHROPIC_API_KEY. Defínela en un archivo .env en la raíz del proyecto.');
		process.exit(1);
	}

	const raw = await readFile(DATA_PATH, 'utf-8');
	const existingCases = JSON.parse(raw);
	const existingSlugs = new Set(existingCases.map((c) => c.slug));

	const client = new Anthropic({ apiKey });

	const schema = `{
  "slug": "string (único, ej: importar-paneles-solares-china-chile)",
  "producto": "string",
  "hs_code": "string (código arancelario de 6 dígitos)",
  "origen": "string",
  "destino": "string",
  "moneda": "USD",
  "arancel_ad_valorem_pct": number,
  "iva_pct": number,
  "gastos_puerto_usd": number,
  "gastos_despacho_agente_usd": number,
  "flete_estimado_m3_usd": number,
  "permisos_especiales": "string (ej: Certificación SEC, Registro Sanitario, etc.)",
  "seo": {
    "titulo_h1": "string",
    "meta_description": "string",
    "keywords": ["array de strings"]
  },
  "faqs": [
    { "pregunta": "string", "respuesta": "string" }
  ]
}`;

	const prompt = `Genera exactamente ${args.count} casos de uso reales de importación comercial B2B de la categoría "${args.category}" hacia países de Chile/LATAM (Chile, Perú, Colombia, México, entre otros), con origen en China, Estados Unidos o India.

Cada caso debe ser un objeto JSON con esta estructura ESTRICTA (mismos nombres de clave, mismos tipos):
${schema}

Reglas obligatorias:
- Responde ÚNICAMENTE con un array JSON válido de ${args.count} objetos, sin texto adicional ni bloques de markdown.
- Cada "slug" debe ser único y NO puede coincidir con ninguno de los siguientes slugs ya existentes: ${[...existingSlugs].join(', ')}.
- "hs_code" debe tener exactamente 6 dígitos numéricos.
- Los valores numéricos deben ser realistas para comercio internacional (aranceles 0-15%, IVA según el país de destino, gastos en USD).
- Cada caso debe incluir al menos 2 FAQs relevantes y específicas al producto.
- Todo el contenido debe estar en español.`;

	console.log(`Generando ${args.count} casos para la categoría "${args.category}" con el modelo ${args.model}...`);

	const response = await client.messages.create({
		model: args.model,
		max_tokens: 8000,
		messages: [{ role: 'user', content: prompt }],
	});

	const text = response.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('');

	let generated;
	try {
		generated = JSON.parse(stripCodeFence(text));
	} catch (err) {
		console.error('No se pudo interpretar la respuesta del modelo como JSON válido:', err.message);
		console.error('Respuesta cruda:', text);
		process.exit(1);
	}

	if (!Array.isArray(generated)) {
		console.error('La respuesta del modelo no es un array JSON.');
		process.exit(1);
	}

	const seenInBatch = new Set();
	const validCases = [];
	for (const item of generated) {
		const result = isValidCase(item, existingSlugs, seenInBatch);
		if (result.ok) {
			validCases.push(item);
			seenInBatch.add(item.slug);
		} else {
			console.warn(`Caso descartado (${result.reason}):`, item?.slug ?? item?.producto ?? '(sin identificar)');
		}
	}

	if (validCases.length === 0) {
		console.error('Ningún caso generado fue válido. No se modificó el archivo.');
		process.exit(1);
	}

	const merged = [...existingCases, ...validCases];
	await writeFile(DATA_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');

	console.log(`Listo: ${validCases.length}/${generated.length} casos nuevos agregados a ${path.relative(process.cwd(), DATA_PATH)}.`);
	console.log(`Total de casos en el dataset: ${merged.length}.`);
}

main().catch((err) => {
	console.error('Error inesperado:', err);
	process.exit(1);
});
