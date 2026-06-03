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

function parseProcessos(html) {
  const processos = []
  const semScript = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const semStyle  = semScript.replace(/<style[\s\S]*?<\/style>/gi, '')
const conteudoMatch = semStyle.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
const tamanhoConteudo = conteudoMatch ? conteudoMatch[1].length : 0
const tamanhoTotal = semStyle.length
console.log('HTML total:', tamanhoTotal, 'Conteudo match:', tamanhoConteudo)  
const conteudo = conteudoMatch ? conteudoMatch[1] : semStyle
  const htmlLinhas = conteudo.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').split('\n')
  const processoRegex = /Processo\s+AGESAN[- ]RS\s+n[oº°]?\s*([\d]+)[/\-_]([\d]{4})/i
  const descRegex = /[–\-]\s*(.+)$/
  let processoAtual = null

  for (const linha of htmlLinhas) {
    const textoLimpo = linha.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!textoLimpo) continue
    const matchProcesso = textoLimpo.match(processoRegex)
    if (matchProcesso) {
      if (processoAtual) processos.push(processoAtual)
      const numero = matchProcesso[1]
      const ano    = matchProcesso[2]
      const descMatch = textoLimpo.match(descRegex)
      const descricao = descMatch ? descMatch[1].trim() : textoLimpo
      processoAtual = {
        numero_processo: numero + '/' + ano,
        nu_audiencia:    numero,
        dt_ano:          ano,
        ds_assunto:      descricao,
        ds_audiencia:    textoLimpo,
        ds_referencia:   'Processo AGESAN-RS nº ' + numero + '/' + ano,
        documentos:      [],
        link_externo:    null,
      }
      continue
    }
    if (processoAtual) {
      const linkMatch = linha.match(/href="([^"]+\.(pdf|xlsx|docx))"/i)
      if (linkMatch) {
        const textoDoc = textoLimpo.replace(/\|.*/, '').trim()
        processoAtual.documentos.push({ tipo: textoDoc || 'Documento', url: linkMatch[1] })
        if (!processoAtual.link_externo) processoAtual.link_externo = linkMatch[1]
      }
    }
  }
  if (processoAtual) processos.push(processoAtual)
  return processos
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  try {
    const html      = await fetchHtml('https://agesan-rs.com.br/documentacao/consulta-publica/')
    const processos = parseProcessos(html)
    let inseridos = 0
    let erros     = 0

    for (const p of processos) {
      const id_audiencia = parseInt('9' + p.nu_audiencia + p.dt_ano)
      const { error } = await supabase.from('consultas').upsert({
        id_audiencia,
        nu_audiencia:    p.nu_audiencia,
        dt_ano:          p.dt_ano,
        numero_processo: p.numero_processo,
        ds_referencia:   p.ds_referencia,
        ds_assunto:      p.ds_assunto,
        ds_audiencia:    p.ds_audiencia,
        ds_modalidade:   'Consulta Pública',
        codigo_agencia:  'AGESAN',
        fonte:           'AGESAN',
        link_externo:    p.link_externo,
        documentos:      p.documentos,
        st_encerrado:    'N',
        st_interno:      'N',
      }, { onConflict: 'id_audiencia', ignoreDuplicates: false })
      if (error) { erros++; console.error('Erro:', error.message) }
      else inseridos++
    }

    res.status(200).json({ ok: true, total: processos.length, inseridos, erros })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
}