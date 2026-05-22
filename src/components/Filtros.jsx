export default function Filtros({ filtros, onChange, modalidades }) {
  return (
    <div style={{
      display: 'flex', gap: '12px', flexWrap: 'wrap',
      padding: '16px', background: '#f9fafb',
      borderRadius: '12px', marginBottom: '24px'
    }}>
      <select
        value={filtros.status}
        onChange={e => onChange({ ...filtros, status: e.target.value })}
        style={{
          padding: '8px 12px', borderRadius: '8px',
          border: '1px solid #e5e7eb', fontSize: '13px',
          background: 'white', cursor: 'pointer'
        }}
      >
        <option value="todas">Todas as consultas</option>
        <option value="abertas">Somente abertas</option>
        <option value="encerradas">Somente encerradas</option>
      </select>

      <select
        value={filtros.modalidade}
        onChange={e => onChange({ ...filtros, modalidade: e.target.value })}
        style={{
          padding: '8px 12px', borderRadius: '8px',
          border: '1px solid #e5e7eb', fontSize: '13px',
          background: 'white', cursor: 'pointer'
        }}
      >
        <option value="todas">Todas as modalidades</option>
        {modalidades.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        value={filtros.empresa}
        onChange={e => onChange({ ...filtros, empresa: e.target.value })}
        style={{
          padding: '8px 12px', borderRadius: '8px',
          border: '1px solid #e5e7eb', fontSize: '13px',
          background: 'white', cursor: 'pointer'
        }}
      >
        <option value="todas">Todas</option>
        <option value="empresa">Aplica-se à minha empresa</option>
      </select>

      <select
        value={filtros.novidade}
        onChange={e => onChange({ ...filtros, novidade: e.target.value })}
        style={{
          padding: '8px 12px', borderRadius: '8px',
          border: '1px solid #e5e7eb', fontSize: '13px',
          background: 'white', cursor: 'pointer'
        }}
      >
        <option value="todas">Todas as datas</option>
        <option value="novas">Novas (últimas 24h)</option>
      </select>
    </div>
  )
}