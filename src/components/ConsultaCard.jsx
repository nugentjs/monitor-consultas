export default function ConsultaCard({ consulta, onToggleEmpresa }) {
  const isNova = () => {
    const visto = new Date(consulta.primeira_vez_visto)
    const agora = new Date()
    const diff = (agora - visto) / (1000 * 60 * 60)
    return diff <= 24
  }

  return (
    <div style={{
      border: consulta.aplica_empresa ? '2px solid #2563eb' : '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {isNova() && (
          <span style={{
            background: '#dcfce7', color: '#166534',
            fontSize: '11px', fontWeight: 600,
            padding: '2px 8px', borderRadius: '99px'
          }}>NOVA</span>
        )}
        <span style={{
          background: '#f3f4f6', color: '#374151',
          fontSize: '11px', padding: '2px 8px', borderRadius: '99px'
        }}>{consulta.ds_modalidade}</span>
        <span style={{
          background: consulta.st_encerrado === 'S' ? '#fee2e2' : '#dcfce7',
          color: consulta.st_encerrado === 'S' ? '#991b1b' : '#166534',
          fontSize: '11px', padding: '2px 8px', borderRadius: '99px'
        }}>
          {consulta.st_encerrado === 'S' ? 'Encerrada' : 'Aberta'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
          ANA • {consulta.dt_ano}
        </span>
      </div>

      <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#111827' }}>
        {consulta.nu_audiencia}/{consulta.dt_ano} — {consulta.ds_modalidade}
      </p>

      <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
        {consulta.ds_audiencia?.slice(0, 200)}
        {consulta.ds_audiencia?.length > 200 ? '...' : ''}
      </p>

      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
        <span>📅 Início: {consulta.dt_inicio_contribuicao}</span>
        <span>⏱ Fim: {consulta.dt_fim_contribuicao}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <input
          type="checkbox"
          id={`emp-${consulta.id_audiencia}`}
          checked={consulta.aplica_empresa || false}
          onChange={() => onToggleEmpresa(consulta)}
        />
        <label
          htmlFor={`emp-${consulta.id_audiencia}`}
          style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}
        >
          Aplica-se à minha empresa
        </label>
      </div>
    </div>
  )
}