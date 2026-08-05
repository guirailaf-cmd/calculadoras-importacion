export interface ImportCaseFaq {
	pregunta: string;
	respuesta: string;
}

export interface ImportCaseSeo {
	titulo_h1: string;
	meta_description: string;
	keywords: string[];
}

export interface ImportCase {
	slug: string;
	producto: string;
	hs_code: string;
	origen: string;
	destino: string;
	moneda: string;
	arancel_ad_valorem_pct: number;
	iva_pct: number;
	gastos_puerto_usd: number;
	gastos_despacho_agente_usd: number;
	flete_estimado_m3_usd: number;
	permisos_especiales: string;
	seo: ImportCaseSeo;
	faqs: ImportCaseFaq[];
}
