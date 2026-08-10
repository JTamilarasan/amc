import PageHeader from '../../components/common/PageHeader'

const Reports = () => {
  return (
    <div className="page-stack">
      <PageHeader title="Reports" subtitle="View business snapshots and renewal performance." />
      <section className="panel-card">
        <div className="panel-heading">
          <h2>Executive and AMC Summary</h2>
          <span>Static reporting snapshot</span>
        </div>
        <div className="report-grid">
          <div className="metric-card">
            <h3>Renewal Conversion</h3>
            <p>84%</p>
            <span>Steady growth in renewals</span>
          </div>
          <div className="metric-card">
            <h3>Pending Follow-ups</h3>
            <p>38</p>
            <span>Priority outreach scheduled</span>
          </div>
          <div className="metric-card">
            <h3>Revenue Trend</h3>
            <p>₹4.85L</p>
            <span>Monthly milestone achieved</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Reports
