import { statusBadge } from '../../utils/helpers'
export default function Badge({ status, children }) {
  return <span className={statusBadge(status)}>{children || status}</span>
}
