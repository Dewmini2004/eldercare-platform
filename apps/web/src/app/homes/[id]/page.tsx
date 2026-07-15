'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { homesApi, bookingsApi } from '@/lib/api/client'

export default function HomeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [home, setHome] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState({ elderName: '', elderAge: 70, elderConditions: '', notes: '' })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'book'>('overview')

  useEffect(() => {
    if (!id) return
    homesApi.getById(id)
      .then(r => setHome(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  async function handleBook() {
    setBookingLoading(true)
    try {
      await bookingsApi.create({
        bookingType: 'residential',
        homeId: id,
        elderName: booking.elderName,
        elderAge: booking.elderAge,
        elderConditions: booking.elderConditions.split(',').map((s: string) => s.trim()).filter(Boolean),
        notes: booking.notes,
        startDate: new Date().toISOString()
      })
      setBookingSuccess(true)
    } catch {
      alert('Booking failed. Please make sure you are logged in.')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#888', fontSize: 14 }}>Loading home details...</p>
    </div>
  )

  if (!home) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#888', fontSize: 14 }}>Home not found.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 28 }}>
      <a href="/homes" style={{ fontSize: 13, color: '#40916C', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← Back to all homes
      </a>

      <div style={{ background: '#D8F3DC', borderRadius: 14, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, marginBottom: 24 }}>
        🏡
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1B4332', margin: '0 0 6px' }}>{home.name}</h1>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{home.address}, {home.city}, {home.district}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {home.isNseVerified && (
              <span style={{ background: '#D8F3DC', color: '#1B4332', borderRadius: 10, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>✓ NSE Verified</span>
            )}
            <span style={{ background: '#F0F9F4', color: '#2D6A4F', border: '1px solid #B7E4C7', borderRadius: 10, padding: '3px 10px', fontSize: 12 }}>{home.type}</span>
            <span style={{ background: '#F0F9F4', color: '#2D6A4F', border: '1px solid #B7E4C7', borderRadius: 10, padding: '3px 10px', fontSize: 12 }}>{home.availableBeds} beds available</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B4332' }}>
            LKR {Number(home.monthlyFeeMin).toLocaleString()} – {Number(home.monthlyFeeMax).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>per month</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #E0D9D0' }}>
        {(['overview', 'book'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #1B4332' : '2px solid transparent', color: activeTab === tab ? '#1B4332' : '#888', fontWeight: activeTab === tab ? 600 : 400, fontSize: 14, cursor: 'pointer', marginBottom: -1 }}>
            {tab === 'overview' ? 'Overview' : 'Book a place'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E0D9D0', borderRadius: 12, padding: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1B4332', margin: '0 0 12px' }}>About this home</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>{home.description || 'A verified elder care home providing quality residential care for seniors in Sri Lanka.'}</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E0D9D0', borderRadius: 12, padding: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1B4332', margin: '0 0 12px' }}>Contact</h3>
            <div style={{ fontSize: 13, color: '#555', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>📞 {home.phone}</div>
              {home.email && <div>✉️ {home.email}</div>}
              {home.website && <div>🌐 {home.website}</div>}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E0D9D0', borderRadius: 12, padding: 18, gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1B4332', margin: '0 0 12px' }}>Key details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total capacity', value: home.totalCapacity + ' residents' },
                { label: 'Available beds', value: home.availableBeds + ' beds' },
                { label: 'Insurance', value: home.acceptsInsurance ? 'Accepted' : 'Not accepted' },
                { label: 'Registration', value: home.registrationNumber }
              ].map(item => (
                <div key={item.label} style={{ background: '#F8F4EF', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'book' && (
        <div style={{ maxWidth: 560 }}>
          {bookingSuccess ? (
            <div style={{ background: '#D8F3DC', border: '1px solid #B7E4C7', borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h3 style={{ color: '#1B4332', margin: '0 0 8px' }}>Booking request sent!</h3>
              <p style={{ color: '#555', fontSize: 13, margin: '0 0 16px' }}>The home admin will review your request and confirm shortly.</p>
              <a href="/dashboard/family" style={{ background: '#1B4332', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Go to dashboard</a>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #E0D9D0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1B4332', margin: '0 0 20px' }}>Book a place at {home.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 6 }}>Elder's full name *</label>
                  <input value={booking.elderName} onChange={e => setBooking(b => ({ ...b, elderName: e.target.value }))} placeholder="e.g. Sunil Perera" style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0D9D0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 6 }}>Elder's age *</label>
                  <input type="number" value={booking.elderAge} onChange={e => setBooking(b => ({ ...b, elderAge: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0D9D0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 6 }}>Medical conditions (comma separated)</label>
                  <input value={booking.elderConditions} onChange={e => setBooking(b => ({ ...b, elderConditions: e.target.value }))} placeholder="e.g. diabetes, hypertension" style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0D9D0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 6 }}>Additional notes</label>
                  <textarea value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} placeholder="Any special requirements..." rows={3} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0D9D0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div style={{ background: '#FEF9E7', border: '1px solid #D4A853', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, color: '#A67C35', fontWeight: 500 }}>Monthly fee estimate</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B4332', marginTop: 2 }}>
                    LKR {Number(home.monthlyFeeMin).toLocaleString()} – {Number(home.monthlyFeeMax).toLocaleString()}
                  </div>
                </div>
                <button onClick={handleBook} disabled={!booking.elderName || bookingLoading} style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: !booking.elderName || bookingLoading ? 'not-allowed' : 'pointer', opacity: !booking.elderName || bookingLoading ? 0.6 : 1 }}>
                  {bookingLoading ? 'Sending request...' : 'Send booking request'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}