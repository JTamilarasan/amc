import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { products } from '../../data/mockData'

const initialRows = [
  { id: 1, item: 'Tally Prime Gold', qty: 1, unit: 'Nos', price: 54000, amount: 54000 },
  { id: 2, item: 'AMC Support', qty: 1, unit: 'Year', price: 8000, amount: 8000 },
]

const SalesVoucher = () => {
  const [rows, setRows] = useState(initialRows)
  const [showAmc, setShowAmc] = useState(true)

  const addRow = () => {
    setRows([...rows, { id: Date.now(), item: 'New Item', qty: 1, unit: 'Nos', price: 0, amount: 0 }])
  }

  const removeRow = (id) => {
    setRows(rows.filter((row) => row.id !== id))
  }

  return (
    <div className="page-stack">
      <PageHeader title="Sales Voucher" subtitle="Create a polished voucher entry for services and AMC billing." />

      <section className="panel-card form-card voucher-layout">
        <div className="voucher-main">
          <div className="form-grid two-col">
            <label className="field">
              <span>Voucher No</span>
              <input value="SV-000001" readOnly />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" defaultValue="2026-08-10" />
            </label>
            <label className="field">
              <span>Party Name *</span>
              <select>
                <option>Mohan Industries</option>
                <option>Suri Traders</option>
                <option>Bright Solutions</option>
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
          </div>

          <label className="field">
            <span>Narration</span>
            <textarea placeholder="Enter narration or note"></textarea>
          </label>

          <div className="panel-heading">
            <h2>Item Details</h2>
            <button className="text-link" onClick={addRow}><Plus size={14} /> Add Item</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      <select defaultValue={row.item}>
                        {products.map((product) => (
                          <option key={product.id} value={product.name}>{product.name}</option>
                        ))}
                      </select>
                    </td>
                    <td><input type="number" defaultValue={row.qty} /></td>
                    <td><input defaultValue={row.unit} /></td>
                    <td><input defaultValue={row.price} /></td>
                    <td>{`₹${row.amount.toLocaleString()}`}</td>
                    <td><button className="icon-btn neutral" onClick={() => removeRow(row.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="amc-panel">
            <div className="panel-heading">
              <h2>AMC Details</h2>
              <button className="text-link" onClick={() => setShowAmc(!showAmc)}>{showAmc ? 'Hide' : 'Show'}</button>
            </div>
            {showAmc ? (
              <div className="form-grid two-col">
                <label className="field">
                  <span>AMC Applicable</span>
                  <input value="Yes" readOnly />
                </label>
                <label className="field">
                  <span>AMC Period From</span>
                  <input type="date" defaultValue="2026-08-10" />
                </label>
                <label className="field">
                  <span>AMC Period To</span>
                  <input type="date" defaultValue="2027-08-10" />
                </label>
                <label className="field">
                  <span>AMC Duration</span>
                  <input value="12 Months" readOnly />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="voucher-summary">
          <h3>Voucher Summary</h3>
          <div className="summary-row"><span>Subtotal</span><strong>₹62,000</strong></div>
          <div className="summary-row"><span>Discount</span><strong>₹0</strong></div>
          <div className="summary-row"><span>Tax</span><strong>₹0</strong></div>
          <div className="summary-row total"><span>Grand Total</span><strong>₹62,000</strong></div>
          <div className="form-actions compact">
            <Button>Save Voucher</Button>
            <Button variant="secondary">Save & New</Button>
            <Button variant="ghost">Preview</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default SalesVoucher
