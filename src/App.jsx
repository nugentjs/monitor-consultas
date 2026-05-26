import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { fetchConsultasANA } from './lib/ana'
import Filtros from './components/Filtros'
import GanttChart from './components/GanttChart'
import TabelaConsultas from './components/TabelaConsultas'

const AGENCIAS = [
  { nome: 'AGERGS',    url: 'https://agergs.rs.gov.br/consultas-e-audiencia-publicas-a-partir-de-2022' },
  { nome: 'AGESAN-RS', url: 'https://agesan-rs.com.br/consulta-publica/' },
  { nome: 'ANA',       url: 'https://participacao-social.ana.gov.br/' },
  { nome: 'AGERST',    url: 'https://www.agerst-rs.com.br/consulta-e-audiencia-publica' },
  { nome: 'AGER',      url: 'https://www.agererechim.rs.gov.br/publicacoes/' },
]

export default function App() {
  const [consultas, setConsultas]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [filtros, setFiltros]           = useState({
    status: 'todas', modalidade: 'todas',
    empresa: 'todas', novidade: 'todas'
  })

  useEffect(() => { carregarConsultas() }, [])

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
        fonte:                  'ANA',
        link_externo:           `https://participacao-social.ana.gov.br/Consulta/${item.ID_AUDIENCIA}`
        }, { onConflict: 'id_audiencia', ignoreDuplicates: false })
        if (error) console.error('Erro upsert:', error)
      }
      await carregarConsultas()
    } catch (err) {
      alert('Erro ao sincronizar: ' + err.message)
    }
    setSincronizando(false)
  }

  async function salvarEdicao(consulta) {
  const { error } = await supabase
    .from('consultas')
    .update({
      codigo_agencia:         consulta.codigo_agencia,
      ds_referencia:          consulta.ds_referencia,
      ds_assunto:             consulta.ds_assunto,
      aplica_empresa:         consulta.aplica_empresa,
      observacao:             consulta.observacao,
      ds_audiencia:           consulta.ds_audiencia,
      dt_inicio_contribuicao: consulta.dt_inicio_contribuicao,
      dt_fim_contribuicao:    consulta.dt_fim_contribuicao,
      st_encerrado:           consulta.st_encerrado,
      link_externo:           consulta.link_externo,
    })
    .eq('id_audiencia', consulta.id_audiencia)
  if (!error) {
    setConsultas(prev =>
      prev.map(c => c.id_audiencia === consulta.id_audiencia ? consulta : c)
    )
  }
  return !error
}

  const modalidades = [...new Set(consultas.map(c => c.ds_modalidade).filter(Boolean))]

  const consultasFiltradas = consultas.filter(c => {
    if (filtros.status === 'abertas'    && c.st_encerrado === 'S')  return false
    if (filtros.status === 'encerradas' && c.st_encerrado !== 'S')  return false
    if (filtros.modalidade !== 'todas'  && c.ds_modalidade !== filtros.modalidade) return false
    if (filtros.empresa === 'empresa'   && !c.aplica_empresa)        return false
    if (filtros.novidade === 'novas') {
      const diff = (new Date() - new Date(c.primeira_vez_visto)) / (1000 * 60 * 60)
      if (diff > 24) return false
    }
    return true
  })

  const totalAbertas  = consultas.filter(c => c.st_encerrado !== 'S').length
  const totalNovas    = consultas.filter(c => {
    const diff = (new Date() - new Date(c.primeira_vez_visto)) / (1000 * 60 * 60)
    return diff <= 24
  }).length
  const totalEmpresa  = consultas.filter(c => c.aplica_empresa).length

  return (
    <>
      {/* CABEÇALHO */}
      <header className="page-header">
        <div className="page-header-left">
          <div>
            <h1>Monitor de Consultas Públicas</h1>
            <div className="subtitle">Acompanhamento de agências reguladoras</div>
          </div>
        </div>
        <div className="page-header-right">
          <div className="agencias">
            {AGENCIAS.map(a => (
              <a key={a.nome} href={a.url} target="_blank"
                rel="noopener noreferrer" className="agencia-link">
                {a.nome} ↗
              </a>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={sincronizar}
            disabled={sincronizando}
          >
            {sincronizando ? 'Sincronizando...' : '⟳ Sincronizar ANA'}
          </button>
        </div>
      </header>

      {/* CORPO */}
      <div className="page-body">

        {/* KPI STRIP */}
        <div className="kpi-strip">
          <div className="kpi-item" style={{ '--kc': 'var(--accent)' }}>
            <span className="kpi-label">Total</span>
            <span className="kpi-val">{consultas.length}</span>
            <span className="kpi-unit">consultas</span>
          </div>
          <div className="kpi-item" style={{ '--kc': 'var(--green)' }}>
            <span className="kpi-label">Abertas</span>
            <span className="kpi-val">{totalAbertas}</span>
            <span className="kpi-unit">em andamento</span>
          </div>
          <div className="kpi-item" style={{ '--kc': 'var(--amber)' }}>
            <span className="kpi-label">Novas (24h)</span>
            <span className="kpi-val">{totalNovas}</span>
            <span className="kpi-unit">identificadas hoje</span>
          </div>
          <div className="kpi-item" style={{ '--kc': '#7c3aed' }}>
            <span className="kpi-label">Minha empresa</span>
            <span className="kpi-val">{totalEmpresa}</span>
            <span className="kpi-unit">marcadas</span>
          </div>
        </div>

        {/* GANTT */}
        <GanttChart consultas={consultas} />

        {/* FILTROS */}
        <Filtros filtros={filtros} onChange={setFiltros} modalidades={modalidades} />

        {/* TABELA */}
        {loading ? (
          <div className="empty-state">
            <p>Carregando consultas...</p>
          </div>
        ) : (
          <TabelaConsultas
            consultas={consultasFiltradas}
            onSalvar={salvarEdicao}
          />
        )}
      </div>
    </>
  )
}