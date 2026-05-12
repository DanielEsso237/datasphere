export default function Spinner({ size = 40 }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  )
}
