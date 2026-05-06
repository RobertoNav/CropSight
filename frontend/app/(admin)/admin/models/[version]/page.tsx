'use client'

export default function ModelDetail({ params }: { params: { version: string } }) {
  
  function handlePromote() {
    if(confirm(`¿Promover versión ${params.version} a Producción?`)){
      // POST /admin/models/:version/promote
      console.log('Promoviendo...')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Modelo v{params.version}</h1>
          <p className="auth-subtitle" style={{ margin: 0 }}>Estado: Staging</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn--ghost">Rollback</button>
          <button className="btn btn--primary" onClick={handlePromote}>Promover a Production</button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Accuracy', val: '0.95' },
          { label: 'Precision', val: '0.93' },
          { label: 'Recall', val: '0.95' },
          { label: 'F1-Score', val: '0.94' }
        ].map(metric => (
          <div key={metric.label} className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eaeaea' }}>
            <p className="form-label" style={{ margin: 0 }}>{metric.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{metric.val}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #eaeaea', textAlign: 'center', color: '#666' }}>
        [Área reservada para gráficas de MLflow / Comparación]
      </div>
    </div>
  )
}