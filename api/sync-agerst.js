import https from 'https'
import { createClient } from '@supabase/supabase-js'

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

function extrairDatas(texto) {
  const regexPeriodo = /(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})/
  const match = texto.match(regexPeriodo)
  if (match) return { inicio: match[1], fim: match[2] }
  const regexUnica = /(\d{2}\/\d{2}\/\d{4})/g
  const datas = [...texto.matchAll(regexUnica)].map(m => m[1])
  if (datas.length >= 2) return { inicio: datas[0], fim: datas[1] }
  if (datas.length === 1) return { inicio: null, fim: datas[0] }
  return { inicio: null, fim: null }
}

function parseConsultas(html) {
  const consultas = []
  const semScript = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const semStyle  = semScript.replace(/<style[\s\S]*?<\/style>/gi, '')

  // extrai todos os links com texto "edital"
  const linksEdital = {}
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let lm
  let ultimoTitulo = null
  while ((lm = linkRegex.exec(semStyle)) !== null) {
    const href  = lm[1].trim()
    const texto = lm[2].replace(/<[^>]+>/g, '').trim()
    if (texto.toLowerCase().includes('edital') && href.startsWith('http')) {
      if (ultimoTitulo) linksEdital[ultimoTitulo] = href
    }
    // detecta título próximo ao link
    const tituloProximo = semStyle.substring(Math.max(0, lm.index - 300), lm.index)
    const tMatch = tituloProximo.match(/(\d+[ªº°]?\s*(Consulta|Audiência|Audiencia|Reunião|Reuniao)[^<]*)/i)
    if (tMatch) ultimoTitulo = tMatch[1].trim()
  }

  const texto = semStyle
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h3>/gi, '\n###SEP###\n')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')

  const linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  let anoAtual = null
  let consultaAtual = null
  let contador = 0

  const anoRegex    = /^(20\d{2})$/
  const tituloRegex = /^(\d+[ªº°]?\s*(Consulta|Audiência|Audiencia|Reunião|Reuniao).+)/i

  for (const linha of linhas) {
    if (linha === '###SEP###') continue

    const matchAno = linha.match(anoRegex)
    if (matchAno) {
      if (consultaAtual) consultas.push(consultaAtual)
      consultaAtual = null
      anoAtual = matchAno[1]
      contador = 0
      continue
    }

    if (!anoAtual) continue

    const matchTitulo = linha.match(tituloRegex)
    if (matchTitulo) {
      if (consultaAtual) consultas.push(consultaAtual)
      contador++

      // busca link do edital para este título
      const linkEdital = linksEdital[linha.trim()] ||
        Object.entries(linksEdital).find(([k]) => k.includes(linha.substring(0, 20)))?.[1] ||
        'https://www.agerst-rs.com.br/consulta-e-audiencia-publica'

      consultaAtual = {
        nu_audiencia:    String(contador).padStart(3, '0'),
        dt_ano:          anoAtual,
        ds_referencia:   linha.trim(),
        ds_assunto:      linha.trim(),
        ds_audiencia:    linha.trim(),
        ds_modalidade:   linha.toLowerCase().includes('audiência') || linha.toLowerCase().includes('audiencia')
                         ? 'Audiência Pública' : 'Consulta Pública',
        dt_inicio:       null,
        dt_fim:          null,
        link_externo:    linkEdital,
        descricao_extra: ''
      }
      continue
    }

    if (consultaAtual && linha.length > 10) {
      const datas = extrairDatas(linha)
      if (datas.inicio && !consultaAtual.dt_inicio) consultaAtual.dt_inicio = datas.inicio
      if (datas.fim    && !consultaAtual.dt_fim)    consultaAtual.dt_fim    = datas.fim
      consultaAtual.descricao_extra += ' ' + linha
      consultaAtual.ds_audiencia = (consultaAtual.ds_assunto + ' ' + consultaAtual.descricao_extra).trim()
    }
  }

  if (consultaAtual) consultas.push(consultaAtual)
  return consultas
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  try {
    const html      = await fetchHtml('https://www.agerst-rs.com.br/consulta-e-audiencia-publica')
    const consultas = parseConsultas(html)
    let inseridos = 0
    let erros     = 0

    for (const c of consultas) {
      const id_audiencia = parseInt('8' + c.nu_audiencia + c.dt_ano)
      const { error } = await supabase.from('consultas').upsert({
        id_audiencia,
        nu_audiencia:           c.nu_audiencia,
        dt_ano:                 c.dt_ano,
        ds_referencia:          c.ds_referencia,
        ds_assunto:             c.ds_assunto,
        ds_audiencia:           c.ds_audiencia,
        ds_modalidade:          c.ds_modalidade,
        dt_inicio_contribuicao: c.dt_inicio,
        dt_fim_contribuicao:    c.dt_fim,
        codigo_agencia:         'AGERST',
        fonte:                  'AGERST',
        link_externo:           c.link_externo,
        st_encerrado:           'N',
        st_interno:             'N',
      }, { onConflict: 'id_audiencia', ignoreDuplicates: false })
      if (error) { erros++; console.error('Erro:', error.message) }
      else inseridos++
    }

    res.status(200).json({ ok: true, total: consultas.length, inseridos, erros })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
}