import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'

const Unauthorized = () => <div className="page-stack"><PageHeader title="Access Denied" subtitle="You do not have permission to open this screen." /><section className="panel-card access-denied-card"><ShieldX size={42} /><p>Contact your administrator if you need access to this module.</p><Link to="/dashboard"><Button>Back to Dashboard</Button></Link></section></div>
export default Unauthorized
