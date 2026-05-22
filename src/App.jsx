import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { fetchConsultasANA } from './lib/ana'
import ConsultaCard from './components/ConsultaCard'
import Filtros from './components/Filtros'

export default function App() {
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [filtros, setFiltros] = useState({
    status: 'todas',
    modalidade: 'todas',
    empresa: 'todas',
    novidade: 'todas'
  })

  useEffect(() => {
    carregarConsultas()
  }, [])

  async function carregarConsultas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .order('dt_inicio_contribuicao', { ascending: false })
    if (!error) setConsultas(data)
    setLoading(false)
  }

  async function sincronizar() {
    setSincronizando(true)
    try {
      const dados = await fetchConsultasANA()
      for (const item of dados) {
  const { error } = await supabase.from('consultas').upsert({
    id_audiencia:           item.ID_AUDIENCIA,
    nu_audiencia:           item.NU_AUDIENCIA,
    ds_audiencia:           item.DS_AUDIENCIA,
    ds_modalidade:          item.DS_MODALIDADE,
    dt_inicio_contribuicao: item.DT_INICIO_CONTRIBUICAO,
    dt_fim_contribuicao:    item.DT_FIM_CONTRIBUICAO,
    dt_realizacao:          item.DT_REALIZACAO,
    dt_ano:                 item.DT_ANO_AUDIENCIA,
    st_encerrado:           item.ST_ENCERRADO,
    ds_periodo:             item.DS_PERIODO,
    st_interno:             item.ST_INTERNO,
    fonte:                  'ANA'
  }, {
    onConflict: 'id_audiencia',
    ignoreDuplicates: false
  })

  if (error) {
    console.error('Erro no upsert:', error)
  } else {
    console.log('Inserido:', item.ID_AUDIENCIA)
  }
}
      await carregarConsultas()
    } catch (err) {
      alert('Erro ao sincronizar: ' + err.message)
    }
    setSincronizando(false)
  }

  async function toggleEmpresa(consulta) {
    const novo = !consulta.aplica_empresa
    await supabase
      .from('consultas')
      .update({ aplica_empresa: novo })
      .eq('id_audiencia', consulta.id_audiencia)
    setConsultas(prev =>
      prev.map(c =>
        c.id_audiencia === consulta.id_audiencia
          ? { ...c, aplica_empresa: novo }
          : c
      )
    )
  }

  const modalidades = [...new Set(consultas.map(c => c.ds_modalidade).filter(Boolean))]

  const consultasFiltradas = consultas.filter(c => {
    if (filtros.status === 'abertas' && c.st_encerrado === 'S') return false
    if (filtros.status === 'encerradas' && c.st_encerrado !== 'S') return false
    if (filtros.modalidade !== 'todas' && c.ds_modalidade !== filtros.modalidade) return false
    if (filtros.empresa === 'empresa' && !c.aplica_empresa) return false
    if (filtros.novidade === 'novas') {
      const diff = (new Date() - new Date(c.primeira_vez_visto)) / (1000 * 60 * 60)
      if (diff > 24) return false
    }
    return true
  })

  const totalAbertas = consultas.filter(c => c.st_encerrado !== 'S').length
  const totalNovas = consultas.filter(c => {
    const diff = (new Date() - new Date(c.primeira_vez_visto)) / (1000 * 60 * 60)
    return diff <= 24
  }).length
  const totalEmpresa = consultas.filter(c => c.aplica_empresa).length

  return (
    <div style={{
      maxWidth: '860px', margin: '0 auto',
      padding: '32px 16px', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>
              Monitor de Consultas Públicas
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Agência Nacional de Águas e Saneamento Básico
            </p>
          </div>
          <button
            onClick={sincronizar}
            disabled={sincronizando}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid #2563eb', background: sincronizando ? '#eff6ff' : '#2563eb',
              color: sincronizando ? '#2563eb' : 'white',
              fontSize: '13px', cursor: sincronizando ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            {sincronizando ? 'Sincronizando...' : '⟳ Sincronizar ANA'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', valor: consultas.length, cor: '#f3f4f6', texto: '#374151' },
            { label: 'Abertas', valor: totalAbertas, cor: '#dcfce7', texto: '#166534' },
            { label: 'Novas (24h)', valor: totalNovas, cor: '#fef9c3', texto: '#854d0e' },
            { label: 'Minha empresa', valor: totalEmpresa, cor: '#dbeafe', texto: '#1e40af' },
          ].map(({ label, valor, cor, texto }) => (
            <div key={label} style={{
              background: cor, borderRadius: '8px',
              padding: '8px 16px', display: 'flex',
              flexDirection: 'column', alignItems: 'center'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 600, color: texto }}>{valor}</span>
              <span style={{ fontSize: '11px', color: texto }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Filtros filtros={filtros} onChange={setFiltros} modalidades={modalidades} />

      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Carregando...</p>
      ) : consultasFiltradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>
          {consultas.length === 0
            ? 'Nenhuma consulta ainda. Clica em "Sincronizar ANA" para importar.'
            : 'Nenhuma consulta encontrada com os filtros selecionados.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {consultasFiltradas.map(c => (
            <ConsultaCard
              key={c.id_audiencia}
              consulta={c}
              onToggleEmpresa={toggleEmpresa}
            />
          ))}
        </div>
      )}
    </div>
  )
}