import { Link } from 'react-router-dom'
import { MapPin, Package, Users, UserRound } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

const cards = [
  {
    title: 'Executive Master',
    icon: UserRound,
    description: 'Create and manage sales/service executives.',
    action: '/masters/executives',
    buttonLabel: 'Create Executive',
    permission: 'executives',
  },
  {
    title: 'Customer Master',
    icon: Users,
    description: 'Create and manage customer information.',
    action: '/masters/customers',
    buttonLabel: 'Manage Customers',
    permission: 'customers',
  },
  {
    title: 'Product Master',
    icon: Package,
    description: 'Manage products and AMC eligibility.',
    action: '/masters/products',
    buttonLabel: 'Manage Products',
    permission: 'products',
  },
  {
    title: 'Area Master',
    icon: MapPin,
    description: 'Create and manage customer service areas.',
    action: '/masters/areas',
    buttonLabel: 'Manage Areas',
    permission: 'areas',
  },
]

const Masters = () => {
  const { isAdmin, hasPermission } = useAuth()
  const visibleCards = cards.filter((card) => isAdmin || hasPermission(card.permission))
  return (
    <div className="page-stack">
      <PageHeader title="Masters" subtitle="Manage your business master data." />
      <div className="masters-grid">
        {visibleCards.map((card) => {
          const Icon = card.icon
          return (
            <article className="master-card" key={card.title}>
              <div className="master-icon">
                <Icon size={24} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="card-actions">
                <Link to={card.action}>
                  <Button>{card.buttonLabel}</Button>
                </Link>
                <Link to={card.action} className="text-link">View / Alter</Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default Masters
