export default function Filtros({ filtros, onChange, modalidades }) {
  return (
    <div className="filtros-wrap">
      <div className="filtro-group">
        <label>Status</label>
        <select
          value={filtros.status}
          onChange={e => onChange({ ...filtros, status: e.target.value })}
        >
          <option value="todas">Todas as consultas</option>
          <option value="abertas">Somente abertas</option>
          <option value="encerradas">Somente encerradas</option>
        </select>
      </div>

      <div className="filtro-group">
        <label>Modalidade</label>
        <select
          value={filtros.modalidade}
          onChange={e => onChange({ ...filtros, modalidade: e.target.value })}
        >
          <option value="todas">Todas as modalidades</option>
          {modalidades.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="filtro-group">
        <label>Aplicabilidade</label>
        <select
          value={filtros.empresa}
          onChange={e => onChange({ ...filtros, empresa: e.target.value })}
        >
          <option value="todas">Todas</option>
          <option value="empresa">Aplica-se à minha empresa</option>
        </select>
      </div>

      <div className="filtro-group">
        <label>Novidades</label>
        <select
          value={filtros.novidade}
          onChange={e => onChange({ ...filtros, novidade: e.target.value })}
        >
          <option value="todas">Todas as datas</option>
          <option value="novas">Novas (últimas 24h)</option>
        </select>
      </div>
    </div>
  )
}