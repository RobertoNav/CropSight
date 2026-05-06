import Link from 'next/link'

const models = [
  { version: '3', dataset: 'plantvillage_v2', status: 'Production', date: '2026-05-01' },
  { version: '2', dataset: 'plantvillage_v1', status: 'Archived', date: '2026-04-15' },
]

export default function ModelList() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Registro de Modelos</h1>
        <button className="btn btn--ghost">Actualizar Lista</button>
      </div>

      <div className="card table-container" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eaeaea', fontSize: '0.875rem' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Versión</th>
              <th style={{ padding: '1rem' }}>Dataset</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.version} style={{ borderBottom: '1px solid #eaeaea' }}>
                <td style={{ padding: '1rem' }}>
                  <Link href={`/admin/models/${model.version}`} className="link" style={{ fontWeight: '500' }}>
                    v{model.version}
                  </Link>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{model.dataset}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${model.status === 'Production' ? 'badge--success' : 'badge--neutral'}`}>
                    {model.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{model.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}