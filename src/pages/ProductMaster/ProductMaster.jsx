import { useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { products } from '../../data/mockData'

const ProductMaster = () => {
  const [amcApplicable, setAmcApplicable] = useState(true)

  return (
    <div className="page-stack">
      <PageHeader title="Product Master" subtitle="Create and manage products and AMC settings." />

      <section className="panel-card form-card">
        <div className="panel-heading">
          <h2>Product Entry</h2>
          <span>Define product rules and AMC eligibility</span>
        </div>
        <div className="form-grid two-col">
          <label className="field">
            <span>Item Name *</span>
            <input placeholder="Enter item name" />
          </label>
          <label className="field">
            <span>Item Group *</span>
            <select>
              <option>Tally Software</option>
              <option>Tally Services</option>
              <option>Add-ons</option>
              <option>Support Services</option>
            </select>
          </label>
          <label className="field">
            <span>Unit *</span>
            <select>
              <option>Nos</option>
              <option>License</option>
              <option>Service</option>
              <option>Year</option>
            </select>
          </label>
          <label className="field">
            <span>AMC Applicable *</span>
            <div className="toggle-wrap">
              <button type="button" className={`toggle ${amcApplicable ? 'active' : ''}`} onClick={() => setAmcApplicable(true)}>
                Yes
              </button>
              <button type="button" className={`toggle ${!amcApplicable ? 'active' : ''}`} onClick={() => setAmcApplicable(false)}>
                No
              </button>
            </div>
          </label>
        </div>

        {amcApplicable ? (
          <div className="amc-panel">
            <h3>Default AMC Duration</h3>
            <label className="field">
              <span>Default AMC Duration</span>
              <select>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>1 Year</option>
                <option>Custom</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className="form-actions">
          <Button>Save Product</Button>
          <Button variant="secondary">Clear</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Product List</h2>
          <span>Current inventory and service catalog</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Item Group</th>
                <th>Unit</th>
                <th>AMC Applicable</th>
                <th>Default AMC Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.group}</td>
                  <td>{product.unit}</td>
                  <td>{product.amcApplicable ? 'Yes' : 'No'}</td>
                  <td>{product.defaultDuration}</td>
                  <td><span className="status-badge green">{product.status}</span></td>
                  <td><span className="table-actions">View · Edit</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default ProductMaster
