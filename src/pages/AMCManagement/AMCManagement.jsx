import { Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { amcRecords } from '../../data/mockData'

const AMCManagement = () => {
  return (
    <div className="page-stack">
      <PageHeader title="AMC Management" subtitle="Track renewals, follow-ups, and customer outreach for active AMC contracts." />

      <section className="stats-grid small-grid">
        <article className="stat-card accent-green">
          <div className="stat-icon"><Search size={18} /></div>
          <div><p className="stat-title">Active AMC</p><h3>920</h3></div>
        </article>
        <article className="stat-card accent-amber">
          <div className="stat-icon"><Search size={18} /></div>
          <div><p className="stat-title">Expiring in 30 Days</p><h3>42</h3></div>
        </article>
        <article className="stat-card accent-red">
          <div className="stat-icon"><Search size={18} /></div>
          <div><p className="stat-title">Expired</p><h3>18</h3></div>
        </article>
        <article className="stat-card accent-blue">
          <div className="stat-icon"><Search size={18} /></div>
          <div><p className="stat-title">Renewed</p><h3>64</h3></div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading mb-12">
          <h2>AMC Portfolio</h2>
          <div className="toolbar">
            <div className="search-box compact">
              <Search size={14} />
              <input placeholder="Search AMC" />
            </div>
            <select>
              <option>All</option>
              <option>Active</option>
              <option>Expiring Soon</option>
              <option>Expired</option>
              <option>Renewed</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Product</th>
                <th>AMC From</th>
                <th>AMC To</th>
                <th>Days Remaining</th>
                <th>Executive</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {amcRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.customer}</td>
                  <td>{record.mobile}</td>
                  <td>{record.product}</td>
                  <td>{record.from}</td>
                  <td>{record.to}</td>
                  <td>{record.daysRemaining}</td>
                  <td>{record.executive}</td>
                  <td><span className={`status-badge ${record.status === 'Expired' ? 'red' : record.status === 'Expiring Soon' ? 'amber' : 'green'}`}>{record.status}</span></td>
                  <td><span className="table-actions">View · Call · Follow-up</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AMCManagement
