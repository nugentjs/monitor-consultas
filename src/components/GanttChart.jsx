import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

export default function GanttChart({ consultas }) {
  const hoje = dayjs().startOf('day')
  const fim  = hoje.add(15, 'day')

  const abertas = consultas.filter(c => {
    if (c.st_encerrado === 'S') return false
    const dtFim = dayjs(c.dt_fim_contribuicao, 'DD/MM/YYYY')
    return dtFim.isValid() && dtFim.isAfter(hoje.subtract(1, 'day'))
  })

  const dias = []
  for (let i = 0; i <= 15; i++) dias.push(hoje.add(i, 'day'))

  const totalDias = 15
  const umDiaPct  = (1 / totalDias) * 100

  function getPositions(consulta) {
    const dtInicio = dayjs(consulta.dt_inicio_contribuicao, 'DD/MM/YYYY').startOf('day')
    const dtFim    = dayjs(consulta.dt_fim_contribuicao,    'DD/MM/YYYY').startOf('day')

    const inicioOffset = dtInicio.diff(hoje, 'day')
    const fimOffset    = dtFim.diff(hoje, 'day')

    const barStart = Math.max(0, inicioOffset)
    const barEnd   = Math.min(totalDias, fimOffset + 1)

    const leftTotal  = (barStart / totalDias) * 100
    const widthTotal = Math.max(0.5, ((barEnd - barStart) / totalDias)) * 100

    const mostraInicio = inicioOffset >= 0
    const leftInicio   = (inicioOffset / totalDias) * 100

    const fimClamped = Math.min(totalDias - 1, fimOffset)
    const leftFim    = (fimClamped / totalDias) * 100

    return { leftTotal, widthTotal, mostraInicio, leftInicio, leftFim, umDiaPct }
  }

  function getLink(c) {
    return c.link_externo || ('https://participacao-social.ana.gov.br/Consulta/' + c.id_audiencia)
  }

  return (
    <div className="gantt-card">
      <div className="gantt-header">
        <div>
          <div className="gantt-title">Cronograma — Consultas Abertas</div>
          <div className="gantt-sub">
            {hoje.format('DD/MM/YYYY')} ate {fim.format('DD/MM/YYYY')} · {abertas.length} consulta{abertas.length !== 1 ? 's' : ''} em andamento
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 24, height: 10, borderRadius: 3, background: '#bfdbfe', display: 'inline-block' }}></span>
            Periodo total
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 14, height: 10, borderRadius: 3, background: 'var(--accent)', display: 'inline-block' }}></span>
            Inicio / Fim
          </span>
        </div>
      </div>

      {abertas.length === 0 ? (
        <div className="gantt-empty">Nenhuma consulta aberta nos proximos 15 dias.</div>
      ) : (
        <div className="gantt-body">
          <div style={{ display: 'flex', marginBottom: '10px', paddingLeft: '220px' }}>
            {dias.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', fontSize: '10px',
                fontWeight: d.isSame(hoje, 'day') ? 700 : 400,
                color: d.isSame(hoje, 'day') ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'DM Mono, monospace'
              }}>
                {d.format('DD/MM')}
              </div>
            ))}
          </div>

          {abertas.map(c => {
            const pos  = getPositions(c)
            const link = getLink(c)
            return (
              <div key={c.id_audiencia} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>

                <div style={{ width: '212px', flexShrink: 0, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }} title={c.ds_audiencia}>
                    {c.nu_audiencia}/{c.dt_ano} — {c.ds_modalidade}
                  </a>
                </div>

                <div style={{ flex: 1, position: 'relative', height: '28px' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                    {dias.map((d, i) => (
                      <div key={i} style={{
                        flex: 1,
                        borderLeft: '1px solid ' + (d.isSame(hoje, 'day') ? 'var(--accent)' : 'var(--border)'),
                        background: d.isSame(hoje, 'day') ? 'rgba(0,85,204,.04)' : 'transparent'
                      }} />
                    ))}
                  </div>

                  <div style={{ position: 'absolute', top: '6px', height: '16px', left: pos.leftTotal + '%', width: pos.widthTotal + '%', background: '#bfdbfe', borderRadius: '4px' }} />

                  {pos.mostraInicio && (
                    <div style={{ position: 'absolute', top: '6px', height: '16px', left: pos.leftInicio + '%', width: pos.umDiaPct + '%', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', padding: '0 2px' }}>inicio</span>
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: '6px', height: '16px', left: pos.leftFim + '%', width: pos.umDiaPct + '%', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', padding: '0 2px' }}>fim</span>
                  </div>
                </div>

                <div style={{ width: '70px', flexShrink: 0, fontSize: '10px', color: 'var(--muted)', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>
                  ate {c.dt_fim_contribuicao}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
