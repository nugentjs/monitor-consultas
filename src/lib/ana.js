export async function fetchConsultasANA() {
  const url = 'https://participacao-social.ana.gov.br/api/audiencias'
  const token = import.meta.env.VITE_ANA_TOKEN

  const res = await fetch(url, {
    headers: {
      'Authorization': token,
      'Accept': 'application/json, text/plain, */*',
    }
  })

  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar dados da ANA`)
  return res.json()
}