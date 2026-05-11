import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= (hover || value) ? 'filled' : ''}`}
          onClick={() => !readonly && onChange && onChange(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
        >
          <Star size={20} fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}
