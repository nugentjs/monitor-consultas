import { RefreshCw, ExternalLink } from 'lucide-react'

const AGENCIAS = [
  { codigo: 'ANA',    nome: 'ANA',       url: 'https://participacao-social.ana.gov.br/',                        sync: '/api/sync-ana' },
  { codigo: 'AGESAN', nome: 'AGESAN-RS', url: 'https://agesan-rs.com.br/documentacao/consulta-publica/',        sync: '/api/sync-agesan' },
  { codigo: 'AGERST', nome: 'AGERST',    url: 'https://www.agerst-rs.com.br/consulta-e-audiencia-publica',      sync: '/api/sync-agerst' },
  { codigo: 'AGERGS', nome: 'AGERGS',    url: 'https://agergs.rs.gov.br/consultas-e-audiencia-publicas-a-partir-de-2022', sync: null },
  { codigo: 'AGER',   nome: 'AGER',      url: 'https://www.agererechim.rs.gov.br/publicacoes/',                 sync: null },
]

function formatarDataSync(dataStr) {
  if (!dataStr) return { label: 'Nunca sincronizado', cor: '#fee2e2', texto: '#b91c1c' }
  const data = new Date(dataStr)
  const agora = new Date()
  const diffMs   = agora - data
  const diffHoras = diffMs / (1000 * 60 * 60)
  const diffDias  = diffMs / (1000 * 60 * 60 * 24)

  const dataFormatada = data.toLocaleDateString('pt-BR')

  if (diffHoras < 1)   return { label: `Agora · ${dataFormatada}`,          cor: '#e6f4ec', texto: '#1a7f4b' }
  if (diffHoras < 24)  return { label: `Hoje · ${dataFormatada}`,            cor: '#e6f4ec', texto: '#1a7f4b' }
  if (diffDias < 2)    return { label: `Há 1 dia · ${dataFormatada}`,        cor: '#fef3c7', texto: '#92600a' }
  if (diffDias < 7)    return { label: `Há ${Math.floor(diffDias)} dias · ${dataFormatada}`, cor: '#fef3c7', texto: '#92600a' }
  return { label: `Há ${Math.floor(diffDias)} dias · ${dataFormatada}`,      cor: '#fee2e2', texto: '#b91c1c' }
}

export default function PainelAgencias({ sincronizacoes, onSincronizar, sincronizando }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      marginBottom: '24px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        fontSize: '12px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.5px',
        color: 'var(--muted)'
      }}>
        Revisão das consultas por agência
      </div>

      {AGENCIAS.map((ag, i) => {
        const sync = sincronizacoes.find(s => s.codigo_agencia === ag.codigo)
        const { label, cor, texto } = formatarDataSync(sync?.ultima_sync)
        const isSincronizando = sincronizando === ag.codigo

        return (
          <div key={ag.codigo} style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 20px', gap: '16px',
            borderBottom: i < AGENCIAS.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            {/* nome */}
            <div style={{ width: '140px', flexShrink: 0 }}>
              <a href={ag.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {ag.nome} <ExternalLink size={11} />
              </a>
            </div>

            {/* badge data */}
            <div style={{ flex: 1 }}>
              <span style={{
                background: cor, color: texto,
                fontSize: '11px', fontWeight: 600,
                padding: '4px 12px', borderRadius: '99px',
              }}>
                {label}
              </span>
            </div>

            {/* botão sync */}
            <button
              onClick={() => ag.sync && onSincronizar(ag)}
              disabled={!ag.sync || isSincronizando}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '6px',
                border: '1px solid var(--border)',
                background: !ag.sync ? 'var(--bg)' : 'var(--surface)',
                color: !ag.sync ? 'var(--muted)' : 'var(--text)',
                fontSize: '12px', fontWeight: 500,
                cursor: !ag.sync ? 'not-allowed' : 'pointer',
                opacity: !ag.sync ? 0.5 : 1,
              }}
            >
              <RefreshCw size={13} style={{ animation: isSincronizando ? 'spin 1s linear infinite' : 'none' }} />
              {isSincronizando ? 'Sincronizando...' : 'Atualizado agora'}
            </button>
          </div>
        )
      })}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}