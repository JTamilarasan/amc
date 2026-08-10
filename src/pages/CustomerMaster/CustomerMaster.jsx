import { useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { customers } from '../../data/mockData'

const CustomerMaster = () => {
  const [category, setCategory] = useState('All')

  return (
    <div className="page-stack">
      <PageHeader title="Customer Master" subtitle="Create and maintain customer details." />

      <section className="panel-card form-card">
        <div className="panel-heading">
          <h2>Customer Details</h2>
          <span>Professional customer profile entry</span>
        </div>
        <div className="form-grid two-col">
          <label className="field">
            <span>Customer Name *</span>
            <input placeholder="Enter customer name" />
          </label>
          <label className="field">
            <span>Address *</span>
            <input placeholder="Enter address" />
          </label>
          <label className="field">
            <span>Pincode *</span>
            <input placeholder="400001" />
          </label>
          <label className="field">
            <span>Country *</span>
            <input placeholder="India" />
          </label>
          <label className="field">
            <span>State *</span>
            <input placeholder="Maharashtra" />
          </label>
          <label className="field">
            <span>GSTIN</span>
            <input placeholder="27AAAPL1234C1Z5" />
          </label>
        </div>

        <div className="form-grid two-col">
          <label className="field">
            <span>Category 1 *</span>
            <select>
              <option>AMC</option>
              <option>Remote AMC</option>
              <option>Support</option>
            </select>
          </label>
          <label className="field">
            <span>Category 2 *</span>
            <select>
              <option>Direct</option>
              <option>Google</option>
              <option>IndiaMART</option>
              <option>Reference</option>
            </select>
          </label>
          <label className="field">
            <span>Executive</span>
            <select>
              <option>Aarav Mehta</option>
              <option>Nisha Rao</option>
              <option>Siddharth Jain</option>
            </select>
          </label>
          <label className="field">
            <span>Notes</span>
            <textarea placeholder="Enter customer notes..."></textarea>
          </label>
        </div>
        <div className="form-actions">
          <Button>Save Customer</Button>
          <Button variant="secondary">Save & Add Another</Button>
          <Button variant="ghost">Clear</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading mb-12">
          <h2>Recent Customers</h2>
          <div className="toolbar">
            <div className="search-box compact">
              <Search size={14} />
              <input placeholder="Search customers" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All</option>
              <option value="AMC">AMC</option>
              <option value="Remote AMC">Remote AMC</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile / Contact</th>
                <th>State</th>
                <th>GSTIN</th>
                <th>Category</th>
                <th>Executive</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.filter((item) => category === 'All' || item.category === category).map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.contact}</td>
                  <td>{customer.state}</td>
                  <td>{customer.gstin}</td>
                  <td>{customer.category}</td>
                  <td>{customer.executive}</td>
                  <td><button className="text-link">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default CustomerMaster
