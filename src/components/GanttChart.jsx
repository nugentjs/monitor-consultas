import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export default function GanttChart({ consultas }) {
  const hoje = dayjs().startOf('day')

  const dias = []
  for (let i = 0; i <= 14; i++) dias.push(hoje.add(i, 'day'))

  const abertas = consultas.filter(c => {
    if (c.st_encerrado === 'S') return false
    const dtFim = dayjs(c.dt_fim_contribuicao, 'DD/MM/YYYY').startOf('day')
    return dtFim.isValid() && dtFim.isSameOrAfter(hoje)
  })

  function getCelula(consulta, dia) {
    const dtInicio = dayjs(consulta.dt_inicio_contribuicao, 'DD/MM/YYYY').startOf('day')
    const dtFim    = dayjs(consulta.dt_fim_contribuicao,    'DD/MM/YYYY').startOf('day')
    const eInicio  = dia.isSame(dtInicio, 'day')
    const eFim     = dia.isSame(dtFim,    'day')
    const dentroPeriodo = (dia.isSame(dtInicio) || dia.isAfter(dtInicio)) &&
                          (dia.isSame(dtFim)    || dia.isBefore(dtFim))

    if (!dentroPeriodo) return { tipo: 'vazio' }
    if (eInicio && eFim)  return { tipo: 'unico' }
    if (eInicio)          return { tipo: 'inicio' }
    if (eFim)             return { tipo: 'fim' }
    return { tipo: 'meio' }
  }

  const estilos = {
    vazio:  { background: 'transparent' },
    meio:   { background: '#bfdbfe' },
    inicio: { background: '#bfdbfe', borderLeft: '3px solid #0055cc' },
    fim:    { background: '#bfdbfe', borderRight: '3px solid #0055cc', position: 'relative' },
    unico:  { background: '#bfdbfe', border: '2px solid #0055cc' },
  }

  function getLinkExterno(c) {
    return c.link_externo || ('https://participacao-social.ana.gov.br/Consulta/' + c.id_audiencia)
  }

  return (
    <div className="gantt-card">
      <div className="gantt-header">
        <div>
          <div className="gantt-title">Cronograma — Consultas Abertas</div>
          <div className="gantt-sub">
            {hoje.format('DD/MM/YYYY')} até {hoje.add(14, 'day').format('DD/MM/YYYY')} · {abertas.length} consulta{abertas.length !== 1 ? 's' : ''} em andamento
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 24, height: 10, borderRadius: 2, background: '#bfdbfe', display: 'inline-block', borderLeft: '3px solid #0055cc' }}></span>
            Período
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#bfdbfe', borderRight: '3px solid #0055cc', display: 'inline-block' }}></span>
            Encerramento
          </span>
        </div>
      </div>

      {abertas.length === 0 ? (
        <div className="gantt-empty">Nenhuma consulta aberta nos próximos 15 dias.</div>
      ) : (
        <div className="gantt-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '200px', textAlign: 'left', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>
                  Consulta
                </th>
                {dias.map((d, i) => (
                  <th key={i} style={{
                    textAlign: 'center',
                    fontSize: '10px',
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: d.isSame(hoje, 'day') ? 700 : 400,
                    color: d.isSame(hoje, 'day') ? 'var(--accent)' : 'var(--muted)',
                    padding: '4px 2px',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: d.isSame(hoje, 'day') ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: d.isSame(hoje, 'day') ? 'rgba(0,85,204,.04)' : 'transparent',
                    whiteSpace: 'nowrap'
                  }}>
                    {d.format('DD/MM')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abertas.map(c => (
                <tr key={c.id_audiencia}>
                  <td style={{
                    padding: '6px 8px',
                    fontSize: '11px', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <a
                      href={getLinkExterno(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                      title={c.ds_assunto || c.ds_audiencia}
                    >
                      {c.nu_audiencia}/{c.dt_ano} — {c.ds_modalidade}
                    </a>
                  </td>
                  {dias.map((d, i) => {
                    const celula = getCelula(c, d)
                    const estilo = estilos[celula.tipo]
                    return (
                      <td key={i} style={{
                        ...estilo,
                        height: '28px',
                        borderBottom: '1px solid var(--border)',
                        borderLeft: d.isSame(hoje, 'day') ? '2px solid rgba(0,85,204,.2)' : undefined,
                        padding: 0,
                        position: 'relative'
                      }}>
                        {celula.tipo === 'fim' && (
                          <span style={{
                            position: 'absolute', right: 2, top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '8px', fontWeight: 700,
                            color: '#0055cc', whiteSpace: 'nowrap'
                          }}>fim</span>
                        )}
                        {celula.tipo === 'inicio' && (
                          <span style={{
                            position: 'absolute', left: 4, top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '8px', fontWeight: 700,
                            color: '#0055cc', whiteSpace: 'nowrap'
                          }}>início</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}