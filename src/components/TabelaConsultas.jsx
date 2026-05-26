import { useState } from 'react'
import { Pencil, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const MODALIDADE_CORES = {
  'Consulta Pública':    { bg: '#e8f0fe', color: '#0055cc' },
  'Audiência Pública':   { bg: '#e6f4ec', color: '#1a7f4b' },
  'Consulta Interna':    { bg: '#fef3c7', color: '#92600a' },
  'Tomada de Subsídios': { bg: '#fdeade', color: '#9b3a1a' },
  'Reunião Pública':     { bg: '#f3e8ff', color: '#6b21a8' },
}

function corModalidade(m) {
  return MODALIDADE_CORES[m] || { bg: '#f0f2f5', color: '#718096' }
}

function ModalEdicao({ consulta, onSalvar, onFechar }) {
  const linkPadrao = 'https://participacao-social.ana.gov.br/Consulta/' + consulta.id_audiencia
  const [form, setForm] = useState({
    codigo_agencia:         consulta.codigo_agencia         || 'ANA',
    ds_referencia:          consulta.ds_referencia          || consulta.nu_audiencia + '/' + consulta.dt_ano || '',
    ds_assunto:             consulta.ds_assunto             || '',
    ds_audiencia:           consulta.ds_audiencia           || '',
    dt_inicio_contribuicao: consulta.dt_inicio_contribuicao || '',
    dt_fim_contribuicao:    consulta.dt_fim_contribuicao    || '',
    st_encerrado:           consulta.st_encerrado           || 'N',
    aplica_empresa:         consulta.aplica_empresa         || false,
    link_externo:           consulta.link_externo           || linkPadrao,
    observacao:             consulta.observacao             || '',
  })
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    setSalvando(true)
    const ok = await onSalvar({ ...consulta, ...form })
    if (ok) onFechar()
    setSalvando(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <span className="modal-title">Editar consulta</span>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              Preencha os campos da consulta ou audiência pública.
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">

          <div className="form-group">
            <label>Agência</label>
            <select value={form.codigo_agencia} onChange={e => setForm(f => ({ ...f, codigo_agencia: e.target.value }))}>
              <option value="ANA">ANA</option>
              <option value="AGESAN">AGESAN-RS</option>
              <option value="AGERGS">AGERGS</option>
              <option value="AGERST">AGERST</option>
              <option value="AGER">AGER</option>
            </select>
          </div>

          <div className="form-group">
            <label>Referência / Processo</label>
            <input
              type="text"
              value={form.ds_referencia}
              onChange={e => setForm(f => ({ ...f, ds_referencia: e.target.value }))}
              placeholder="Ex: 002/2026 ou Processo AGESAN-RS nº 1808/2026"
            />
          </div>

          <div className="form-group">
            <label>Assunto</label>
            <textarea
              rows={2}
              value={form.ds_assunto}
              onChange={e => setForm(f => ({ ...f, ds_assunto: e.target.value }))}
              placeholder="Título curto da consulta"
            />
          </div>

          <div className="form-group">
            <label>Descrição completa</label>
            <textarea
              rows={3}
              value={form.ds_audiencia}
              onChange={e => setForm(f => ({ ...f, ds_audiencia: e.target.value }))}
              placeholder="Descrição detalhada..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Abertura</label>
              <input
                type="date"
                value={form.dt_inicio_contribuicao
                  ? form.dt_inicio_contribuicao.split('/').reverse().join('-')
                  : ''}
                onChange={e => {
                  const [y, m, d] = e.target.value.split('-')
                  setForm(f => ({ ...f, dt_inicio_contribuicao: d + '/' + m + '/' + y }))
                }}
              />
            </div>
            <div className="form-group">
              <label>Encerramento</label>
              <input
                type="date"
                value={form.dt_fim_contribuicao
                  ? form.dt_fim_contribuicao.split('/').reverse().join('-')
                  : ''}
                onChange={e => {
                  const [y, m, d] = e.target.value.split('-')
                  setForm(f => ({ ...f, dt_fim_contribuicao: d + '/' + m + '/' + y }))
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Situação</label>
              <select value={form.st_encerrado} onChange={e => setForm(f => ({ ...f, st_encerrado: e.target.value }))}>
                <option value="N">Aberta</option>
                <option value="S">Encerrada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Aplicável</label>
              <select value={form.aplica_empresa ? 'S' : 'N'} onChange={e => setForm(f => ({ ...f, aplica_empresa: e.target.value === 'S' }))}>
                <option value="N">Não</option>
                <option value="S">Sim</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Link de acesso</label>
            <input
              type="url"
              value={form.link_externo}
              onChange={e => setForm(f => ({ ...f, link_externo: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Observação interna</label>
            <textarea
              rows={2}
              placeholder="Anotações internas..."
              value={form.observacao}
              onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
            />
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-secondary btn-sm" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function isNova(c) {
  return (new Date() - new Date(c.primeira_vez_visto)) / (1000 * 60 * 60) <= 24
}

function diasRestantes(dtFim) {
  if (!dtFim) return null
  const fim = dayjs(dtFim, 'DD/MM/YYYY')
  if (!fim.isValid()) return null
  return fim.diff(dayjs(), 'day')
}

function parseData(str) {
  if (!str) return 0
  const d = dayjs(str, 'DD/MM/YYYY')
  return d.isValid() ? d.valueOf() : 0
}

const COLUNAS = [
  { key: 'nu_audiencia',           label: 'Ref.' },
  { key: 'ds_modalidade',          label: 'Modalidade' },
  { key: 'ds_audiencia',           label: 'Descrição' },
  { key: 'dt_inicio_contribuicao', label: 'Abertura' },
  { key: 'dt_fim_contribuicao',    label: 'Encerramento' },
  { key: 'prazo',                  label: 'Prazo' },
  { key: 'st_encerrado',           label: 'Status' },
  { key: 'aplica_empresa',         label: 'Empresa' },
]

export default function TabelaConsultas({ consultas, onSalvar }) {
  const [editando, setEditando]   = useState(null)
  const [ordenacao, setOrdenacao] = useState({ key: null, dir: 'asc' })

  function toggleOrdem(key) {
    setOrdenacao(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  function IconeOrdem({ colKey }) {
    if (ordenacao.key !== colKey) return <ChevronsUpDown size={12} style={{ opacity: .35, marginLeft: 4 }} />
    return ordenacao.dir === 'asc'
      ? <ChevronUp size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />
      : <ChevronDown size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />
  }

  function valorOrdenacao(c, key) {
    if (key === 'dt_inicio_contribuicao') return parseData(c.dt_inicio_contribuicao)
    if (key === 'dt_fim_contribuicao')    return parseData(c.dt_fim_contribuicao)
    if (key === 'prazo')                  return diasRestantes(c.dt_fim_contribuicao) ?? 9999
    if (key === 'st_encerrado')           return c.st_encerrado === 'S' ? 1 : 0
    if (key === 'aplica_empresa')         return c.aplica_empresa ? 0 : 1
    return (c[key] || '').toString().toLowerCase()
  }

  const consultasOrdenadas = [...consultas].sort((a, b) => {
    if (!ordenacao.key) return 0
    const va = valorOrdenacao(a, ordenacao.key)
    const vb = valorOrdenacao(b, ordenacao.key)
    const mult = ordenacao.dir === 'asc' ? 1 : -1
    return va < vb ? -mult : va > vb ? mult : 0
  })

  function getLinkExterno(c) {
    return c.link_externo || ('https://participacao-social.ana.gov.br/Consulta/' + c.id_audiencia)
  }

  return (
    <>
      {editando && (
        <ModalEdicao consulta={editando} onSalvar={onSalvar} onFechar={() => setEditando(null)} />
      )}
      <div className="table-wrap">
        {consultas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma consulta encontrada</p>
            <small>Ajuste os filtros ou sincronize os dados</small>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {COLUNAS.map(col => (
                  <th key={col.key} onClick={() => toggleOrdem(col.key)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {col.label}<IconeOrdem colKey={col.key} />
                    </span>
                  </th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {consultasOrdenadas.map(c => {
                const dias = diasRestantes(c.dt_fim_contribuicao)
                const prazoColor = dias === null ? 'var(--muted)' : dias <= 3 ? 'var(--red)' : dias <= 7 ? 'var(--amber)' : 'var(--green)'
                const { bg, color } = corModalidade(c.ds_modalidade)
                const link = getLinkExterno(c)
                return (
                  <tr key={c.id_audiencia}>
                    <td className="td-mono">
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>
                        {c.nu_audiencia}/{c.dt_ano}
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td>
                      <span className="badge" style={{ background: bg, color: color }}>
                        {c.ds_modalidade}
                      </span>
                    </td>
                    <td style={{ maxWidth: '360px' }}>
                      <div style={{ fontSize: '12px', lineHeight: 1.6, whiteSpace: 'normal' }}>
                        {c.ds_audiencia}
                      </div>
                      {c.observacao && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                          📝 {c.observacao}
                        </div>
                      )}
                    </td>
                    <td className="td-mono">{c.dt_inicio_contribuicao}</td>
                    <td className="td-mono">{c.dt_fim_contribuicao}</td>
                    <td>
                      {dias !== null && c.st_encerrado !== 'S' ? (
                        <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: prazoColor }}>
                          {dias < 0 ? 'Encerrado' : dias === 0 ? 'Hoje' : dias + 'd'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span className={'badge ' + (c.st_encerrado === 'S' ? 'badge-encerrada' : 'badge-aberta')}>
                          {c.st_encerrado === 'S' ? 'Encerrada' : 'Aberta'}
                        </span>
                        {isNova(c) && <span className="badge badge-nova">Nova</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.aplica_empresa
                        ? <span className="badge badge-empresa">✓ Sim</span>
                        : <span style={{ fontSize: '12px', color: 'var(--muted)' }}>—</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditando(c)} title="Editar" style={{ padding: '5px 8px' }}>
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
