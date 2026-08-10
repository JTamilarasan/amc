import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { executives } from '../../data/mockData'

const ExecutiveMaster = () => {
  return (
    <div className="page-stack">
      <PageHeader title="Executive Master" subtitle="Manage executives responsible for customer sales and follow-ups." action={<Button><Plus size={16} /> <span>Add Executive</span></Button>} />

      <section className="panel-card form-card">
        <div className="panel-heading">
          <h2>Add Executive</h2>
          <span>Capture key sales team contacts</span>
        </div>
        <div className="form-grid two-col">
          <label className="field">
            <span>Executive Name *</span>
            <input placeholder="Enter executive name" />
          </label>
        </div>
        <div className="form-actions">
          <Button>Save Executive</Button>
          <Button variant="secondary">Clear</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Existing Executives</h2>
          <span>Current team roster</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Executive Name</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {executives.map((executive) => (
                <tr key={executive.id}>
                  <td>{executive.id}</td>
                  <td>{executive.name}</td>
                  <td>{executive.createdDate}</td>
                  <td><span className={`status-badge ${executive.status === 'Active' ? 'green' : 'amber'}`}>{executive.status}</span></td>
                  <td><span className="table-actions">View · Edit · Delete</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default ExecutiveMaster
