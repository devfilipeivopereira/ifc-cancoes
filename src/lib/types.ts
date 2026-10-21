export type Song = {
  musica: string;
  titulo_canonico: string;
  artista_ministerio: string;
  fonte_artista: string;
  artistas_no_letras: string;
  artista_gemini: string;
  artista_divergente: string;
  versao_estrangeira: string;
  titulo_original: string;
  artista_original: string;
  compositores: string;
  ano_lancamento: number | string;
  decada: string;
  estilo: string;
  confianca: string;
  tom: string;
  total_usos: number;
  primeiro_uso: string;
  ultimo_uso: string;
  usos_ultimos_12m: number;
  usos_por_ano: Record<string, number>;
  tipos_evento: Record<string, number>;
  lyrics_url: string;
  lyrics_source: string;
  letra_confirmada_em: string;
  letras_sugestao_nao_verificada: string;
  link_letra: string;
  link_letra_verificado: string;
  datas: string[];
  id: string;
};

export type Culto = {
  id: string;
  data: string;
  fonte_data: string;
  evento: string;
  tipo: string;
  fonte_tipo: string;
  secoes: string[];
  musicas: string[];
};

export type Stats = {
  gerado_em: string;
  eventos: number;
  eventos_com_data: number;
  execucoes: number;
  musicas_distintas: number;
  musicas_por_evento: { media: number; mediana: number };
  concentracao_top20: number;
  concentracao_top50: number;
  eventos_com_top20: number;
  usadas_uma_vez: number;
  versoes_estrangeiras: {
    musicas: number;
    pct_musicas: number;
    pct_execucoes: number;
  };
  biblioteca_total: number;
  biblioteca_nunca_usadas: string[];
};

export type Performance = {
  songId: string;
  title: string;
  date: string;
  year: number | null;
  month: number | null;
  weekday: number | null;
  tipo: string;
  eventId: string;
  eventName: string;
};
